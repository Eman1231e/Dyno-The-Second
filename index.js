import {
 Client,GatewayIntentBits,Events,SlashCommandBuilder,ActionRowBuilder,ButtonBuilder,
 ButtonStyle,EmbedBuilder,MessageFlags
} from "discord.js";
import {
 AudioPlayerStatus,VoiceConnectionStatus,createAudioPlayer,createAudioResource,
 entersState,getVoiceConnection,joinVoiceChannel,NoSubscriberBehavior,generateDependencyReport
} from "@discordjs/voice";
import play from "play-dl";
import "dotenv/config";

const OWNER="1139989614103380131", TZ="America/Toronto", COOLDOWN=300000;
const SCHOOL={1:["09:15","16:30"],2:["09:15","16:30"],3:["09:45","16:30"],4:["09:15","16:30"],5:["09:15","16:30"]};
let mode="auto",custom=null;
const cooldowns=new Map(),music=new Map();
if(!process.env.DISCORD_TOKEN)throw Error("DISCORD_TOKEN missing");

const client=new Client({intents:[
 GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,
 GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates
]});

function localNow(){const p=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:TZ,weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts().map(x=>[x.type,x.value]));return{d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[p.weekday],m:+p.hour*60 + +p.minute}}
const mins=s=>{const[h,m]=s.split(":").map(Number);return h*60+m};
function atSchool(){const n=localNow(),s=SCHOOL[n.d];return !!s&&n.m>=mins(s[0])&&n.m<mins(s[1])}
function effective(){return mode==="auto"?(atSchool()?"school":"available"):mode}
function reception(){
 if(effective()==="custom"&&custom)return custom;
 const f={school:"📚 Dyno is currently at school. He'll respond when he's available.",busy:"🔴 Dyno is currently busy. He'll get back to you when he can.",away:"🌙 Dyno is currently away. Your ping has been noted.",sleeping:"💤 Dyno is currently sleeping. Bro is NOT answering you right now 😭"};
 return f[effective()]||["You have summoned Dyno. State your business.","The 1st has been summoned.","Why are we pinging Dyno 🤨","Your message has been forwarded to Dyno. Probably."][Math.floor(Math.random()*4)];
}

function state(g){
 if(!music.has(g)){
  const player=createAudioPlayer({behaviors:{noSubscriber:NoSubscriberBehavior.Pause}});
  const s={player,queue:[],current:null,loop:false,text:null};
  player.on("stateChange",(a,b)=>console.log(`[AUDIO] ${a.status} -> ${b.status}`));
  player.on(AudioPlayerStatus.Idle,()=>next(g).catch(console.error));
  player.on("error",e=>{console.error("[AUDIO ERROR]",e);next(g).catch(console.error)});
  music.set(g,s);
 }
 return music.get(g);
}
async function findTrack(q){
 const kind=await play.validate(q);
 if(kind==="yt_video"){const v=(await play.video_basic_info(q)).video_details;return{title:v.title,url:v.url,img:v.thumbnails?.at(-1)?.url}}
 const r=await play.search(q,{limit:1,source:{youtube:"video"}});
 if(!r.length)throw Error("No song found");
 return{title:r[0].title,url:r[0].url,img:r[0].thumbnails?.at(-1)?.url};
}
function controls(){return[new ActionRowBuilder().addComponents(
 new ButtonBuilder().setCustomId("music_pause").setEmoji("⏯️").setStyle(ButtonStyle.Primary),
 new ButtonBuilder().setCustomId("music_skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
 new ButtonBuilder().setCustomId("music_loop").setEmoji("🔁").setStyle(ButtonStyle.Secondary),
 new ButtonBuilder().setCustomId("music_stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger)
)]}
async function start(g,t){
 const s=state(g);console.log(`[MUSIC] Stream lookup: ${t.title}`);
 const x=await play.stream(t.url);
 s.current=t;s.player.play(createAudioResource(x.stream,{inputType:x.type}));
 if(s.text)await s.text.send({embeds:[new EmbedBuilder().setTitle("🎵 Dyno The 2nd — Now Playing").setDescription(`**${t.title}**`).setThumbnail(t.img||null).setFooter({text:`Queue: ${s.queue.length} • Loop: ${s.loop?"On":"Off"}`})],components:controls()}).catch(()=>{});
}
async function next(g){const s=state(g);if(s.loop&&s.current)return start(g,s.current);const n=s.queue.shift();if(!n){s.current=null;return}await start(g,n)}

async function voiceReady(i,vc){
 const old=getVoiceConnection(i.guildId);if(old){try{old.destroy()}catch{}}
 const cn=joinVoiceChannel({
  channelId:vc.id,guildId:i.guildId,adapterCreator:i.guild.voiceAdapterCreator,
  selfDeaf:true,selfMute:false,debug:true
 });
 cn.on("stateChange",(a,b)=>console.log(`[VOICE STATE] ${a.status} -> ${b.status}`));
 cn.on("debug",m=>console.log(`[VOICE DEBUG] ${m}`));
 cn.on("error",e=>console.error("[VOICE ERROR]",e));
 try{
  console.log(`[VOICE] Attempting ${vc.name} (${vc.id})`);
  await entersState(cn,VoiceConnectionStatus.Ready,30000);
  console.log("[VOICE] READY");
  return cn;
 }catch(e){
  console.error("[VOICE TIMEOUT]",e);
  try{cn.destroy()}catch{}
  throw Error("Discord voice never reached Ready; connection was cleaned up. Check VOICE DEBUG in Railway.");
 }
}

const commands=[
 new SlashCommandBuilder().setName("dynostatus").setDescription("Set Dyno's receptionist status").addStringOption(o=>o.setName("status").setDescription("Status").setRequired(true).addChoices({name:"Automatic",value:"auto"},{name:"Available",value:"available"},{name:"School",value:"school"},{name:"Busy",value:"busy"},{name:"Away",value:"away"},{name:"Sleeping",value:"sleeping"},{name:"Custom",value:"custom"})).addStringOption(o=>o.setName("message").setDescription("Custom response")),
 new SlashCommandBuilder().setName("dynostatuscheck").setDescription("Check receptionist status"),
 new SlashCommandBuilder().setName("play").setDescription("Play or queue a song").addStringOption(o=>o.setName("query").setDescription("Song name or YouTube URL").setRequired(true)),
 new SlashCommandBuilder().setName("queue").setDescription("Show music queue"),
 new SlashCommandBuilder().setName("stopmusic").setDescription("Stop music and leave voice")
].map(x=>x.toJSON());

client.once(Events.ClientReady,async c=>{
 console.log(`Dyno The 2nd v1.4.0 online as ${c.user.tag}`);
 console.log(`Node ${process.version}`);
 console.log(generateDependencyReport());
 await c.application.commands.set(commands);console.log("Commands registered");
});

client.on(Events.MessageCreate,async m=>{
 if(m.author.bot||m.mentions.everyone||m.type===19)return;
 if(!new RegExp(`<@!?${OWNER}>`).test(m.content))return;
 if(m.author.id===OWNER)return void await m.reply("Sir... that's literally you. 😭");
 const last=cooldowns.get(m.author.id)||0;if(Date.now()-last<COOLDOWN)return;
 cooldowns.set(m.author.id,Date.now());await m.reply(reception());
});

client.on(Events.InteractionCreate,async i=>{
 if(i.isChatInputCommand()){
  if(["dynostatus","dynostatuscheck"].includes(i.commandName)&&i.user.id!==OWNER)return void await i.reply({content:"Nice try. These controls belong to Dyno. 😭",flags:MessageFlags.Ephemeral});
  if(i.commandName==="dynostatus"){const s=i.options.getString("status",true),m=i.options.getString("message");if(s==="custom"&&!m)return void await i.reply({content:"Custom needs a message.",flags:MessageFlags.Ephemeral});mode=s;custom=s==="custom"?m:null;return void await i.reply({content:`Receptionist set to **${s}**. Effective: **${effective()}**.`,flags:MessageFlags.Ephemeral})}
  if(i.commandName==="dynostatuscheck")return void await i.reply({content:`Mode: **${mode}** • Effective: **${effective()}** • School: **${atSchool()?"yes":"no"}**`,flags:MessageFlags.Ephemeral});
  if(i.commandName==="play"){
   const vc=i.member?.voice?.channel;if(!vc)return void await i.reply({content:"Join a voice channel first 😭",flags:MessageFlags.Ephemeral});
   await i.deferReply();
   try{
    const s=state(i.guildId);s.text=i.channel;
    let cn=getVoiceConnection(i.guildId);
    if(!cn||cn.state.status!==VoiceConnectionStatus.Ready)cn=await voiceReady(i,vc);
    const sub=cn.subscribe(s.player);if(!sub)throw Error("Audio player could not subscribe to voice.");
    const t=await findTrack(i.options.getString("query",true));
    if(!s.current){await start(i.guildId,t);await i.editReply(`▶️ Playing **${t.title}**`)}
    else{s.queue.push(t);await i.editReply(`➕ Queued **${t.title}**`)}
   }catch(e){console.error("[PLAY ERROR]",e);await i.editReply(`Music error: ${e.message}`)}
   return;
  }
  if(i.commandName==="queue"){const s=state(i.guildId),q=s.queue.slice(0,10).map((x,n)=>`${n+1}. ${x.title}`).join("\n")||"Queue is empty.";return void await i.reply({embeds:[new EmbedBuilder().setTitle("🎵 Queue").setDescription(q)]})}
  if(i.commandName==="stopmusic"){const s=state(i.guildId);s.queue=[];s.current=null;s.player.stop(true);getVoiceConnection(i.guildId)?.destroy();return void await i.reply("⏹️ Music stopped.")}
 }
 if(i.isButton()&&i.customId.startsWith("music_")){
  const s=state(i.guildId);
  if(i.customId==="music_pause"){s.player.state.status===AudioPlayerStatus.Playing?s.player.pause():s.player.unpause();await i.reply({content:"⏯️ Toggled pause.",flags:MessageFlags.Ephemeral})}
  else if(i.customId==="music_skip"){s.player.stop();await i.reply({content:"⏭️ Skipped.",flags:MessageFlags.Ephemeral})}
  else if(i.customId==="music_loop"){s.loop=!s.loop;await i.reply({content:`🔁 Loop ${s.loop?"on":"off"}.`,flags:MessageFlags.Ephemeral})}
  else if(i.customId==="music_stop"){s.queue=[];s.current=null;s.player.stop(true);getVoiceConnection(i.guildId)?.destroy();await i.reply({content:"⏹️ Stopped.",flags:MessageFlags.Ephemeral})}
 }
});
client.login(process.env.DISCORD_TOKEN);
