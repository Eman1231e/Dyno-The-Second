import {Client,GatewayIntentBits,Events,SlashCommandBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,EmbedBuilder,MessageFlags} from "discord.js";
import {AudioPlayerStatus,createAudioPlayer,createAudioResource,entersState,getVoiceConnection,joinVoiceChannel,NoSubscriberBehavior,VoiceConnectionStatus} from "@discordjs/voice";
import play from "play-dl"; import "dotenv/config";

const OWNER="1139989614103380131",TZ="America/Toronto",CD=300000;
const SCHOOL={1:["09:15","16:30"],2:["09:15","16:30"],3:["09:45","16:30"],4:["09:15","16:30"],5:["09:15","16:30"]};
let mode="auto",custom=null; const cds=new Map(),music=new Map();
if(!process.env.DISCORD_TOKEN)throw Error("DISCORD_TOKEN missing");
const c=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates]});

function now(){let p=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:TZ,weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts().map(x=>[x.type,x.value]));return{d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[p.weekday],m:+p.hour*60 + +p.minute}}
const mm=s=>{let[h,m]=s.split(":").map(Number);return h*60+m};
function school(){let n=now(),s=SCHOOL[n.d];return !!s&&n.m>=mm(s[0])&&n.m<mm(s[1])}
function status(){return mode==="auto"?(school()?"school":"available"):mode}
function reply(){if(status()==="custom"&&custom)return custom;let f={school:"📚 Dyno is currently at school. He'll respond when he's available.",busy:"🔴 Dyno is currently busy. He'll get back to you when he can.",away:"🌙 Dyno is currently away. Your ping has been noted.",sleeping:"💤 Dyno is currently sleeping. Bro is NOT answering you right now 😭"};return f[status()]||["You have summoned Dyno. State your business.","The 1st has been summoned.","Why are we pinging Dyno 🤨","Your message has been forwarded to Dyno. Probably."][Math.floor(Math.random()*4)]}

function ms(g){if(!music.has(g)){let p=createAudioPlayer({behaviors:{noSubscriber:NoSubscriberBehavior.Pause}}),s={p,q:[],cur:null,loop:false,ch:null};p.on(AudioPlayerStatus.Idle,()=>next(g).catch(console.error));p.on("error",e=>{console.error(e);next(g).catch(console.error)});music.set(g,s)}return music.get(g)}
async function track(q){let k=await play.validate(q);if(k==="yt_video"){let v=(await play.video_basic_info(q)).video_details;return{title:v.title,url:v.url,img:v.thumbnails?.at(-1)?.url}}let r=await play.search(q,{limit:1,source:{youtube:"video"}});if(!r.length)throw Error("No song found");return{title:r[0].title,url:r[0].url,img:r[0].thumbnails?.at(-1)?.url}}
function buttons(){return[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("m_pause").setEmoji("⏯️").setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId("m_skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId("m_loop").setEmoji("🔁").setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId("m_stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger))]}
async function start(g,t){let s=ms(g),x=await play.stream(t.url);s.cur=t;s.p.play(createAudioResource(x.stream,{inputType:x.type}));if(s.ch)await s.ch.send({embeds:[new EmbedBuilder().setTitle("🎵 Dyno The 2nd — Now Playing").setDescription(`**${t.title}**`).setThumbnail(t.img||null).setFooter({text:`Queue: ${s.q.length} • Loop: ${s.loop?"On":"Off"}`})],components:buttons()}).catch(()=>{})}
async function next(g){let s=ms(g);if(s.loop&&s.cur)return start(g,s.cur);let n=s.q.shift();if(!n){s.cur=null;return}await start(g,n)}

const cmds=[
new SlashCommandBuilder().setName("dynostatus").setDescription("Set Dyno's receptionist status").addStringOption(o=>o.setName("status").setDescription("Status").setRequired(true).addChoices({name:"Automatic",value:"auto"},{name:"Available",value:"available"},{name:"School",value:"school"},{name:"Busy",value:"busy"},{name:"Away",value:"away"},{name:"Sleeping",value:"sleeping"},{name:"Custom",value:"custom"})).addStringOption(o=>o.setName("message").setDescription("Custom response")),
new SlashCommandBuilder().setName("dynostatuscheck").setDescription("Check receptionist status"),
new SlashCommandBuilder().setName("play").setDescription("Play or queue a song").addStringOption(o=>o.setName("query").setDescription("Song name or YouTube URL").setRequired(true)),
new SlashCommandBuilder().setName("queue").setDescription("Show music queue"),
new SlashCommandBuilder().setName("stopmusic").setDescription("Stop music and leave voice")
].map(x=>x.toJSON());

c.once(Events.ClientReady,async x=>{console.log(`Dyno The 2nd online as ${x.user.tag}`);await x.application.commands.set(cmds);console.log("Commands registered")});

c.on(Events.MessageCreate,async m=>{if(m.author.bot||m.mentions.everyone||m.type===19)return;if(!new RegExp(`<@!?${OWNER}>`).test(m.content))return;if(m.author.id===OWNER)return void await m.reply("Sir... that's literally you. 😭");let l=cds.get(m.author.id)||0;if(Date.now()-l<CD)return;cds.set(m.author.id,Date.now());await m.reply(reply())});

c.on(Events.InteractionCreate,async i=>{
if(i.isChatInputCommand()){
if(["dynostatus","dynostatuscheck"].includes(i.commandName)&&i.user.id!==OWNER)return void await i.reply({content:"Nice try. These controls belong to Dyno. 😭",flags:MessageFlags.Ephemeral});
if(i.commandName==="dynostatus"){let s=i.options.getString("status",true),m=i.options.getString("message");if(s==="custom"&&!m)return void await i.reply({content:"Custom needs a message.",flags:MessageFlags.Ephemeral});mode=s;custom=s==="custom"?m:null;return void await i.reply({content:`Receptionist set to **${s}**. Effective: **${status()}**.`,flags:MessageFlags.Ephemeral})}
if(i.commandName==="dynostatuscheck")return void await i.reply({content:`Mode: **${mode}** • Effective: **${status()}** • School: **${school()?"yes":"no"}**`,flags:MessageFlags.Ephemeral});
if(i.commandName==="play"){let v=i.member?.voice?.channel;if(!v)return void await i.reply({content:"Join a voice channel first 😭",flags:MessageFlags.Ephemeral});await i.deferReply();try{let s=ms(i.guildId);s.ch=i.channel;let cn=getVoiceConnection(i.guildId)||joinVoiceChannel({channelId:v.id,guildId:i.guildId,adapterCreator:i.guild.voiceAdapterCreator,selfDeaf:true});await entersState(cn,VoiceConnectionStatus.Ready,20000);cn.subscribe(s.p);let t=await track(i.options.getString("query",true));if(!s.cur){await start(i.guildId,t);await i.editReply(`▶️ Playing **${t.title}**`)}else{s.q.push(t);await i.editReply(`➕ Queued **${t.title}**`)}}catch(e){console.error(e);await i.editReply(`Music error: ${e.message}`)}return}
if(i.commandName==="queue"){let s=ms(i.guildId),q=s.q.slice(0,10).map((x,n)=>`${n+1}. ${x.title}`).join("\n")||"Queue is empty.";return void await i.reply({embeds:[new EmbedBuilder().setTitle("🎵 Queue").setDescription(q)]})}
if(i.commandName==="stopmusic"){let s=ms(i.guildId);s.q=[];s.cur=null;s.p.stop(true);getVoiceConnection(i.guildId)?.destroy();return void await i.reply("⏹️ Music stopped.")}
}
if(i.isButton()&&i.customId.startsWith("m_")){let s=ms(i.guildId);if(i.customId==="m_pause"){s.p.state.status===AudioPlayerStatus.Playing?s.p.pause():s.p.unpause();await i.reply({content:"⏯️ Toggled pause.",flags:MessageFlags.Ephemeral})}else if(i.customId==="m_skip"){s.p.stop();await i.reply({content:"⏭️ Skipped.",flags:MessageFlags.Ephemeral})}else if(i.customId==="m_loop"){s.loop=!s.loop;await i.reply({content:`🔁 Loop ${s.loop?"on":"off"}.`,flags:MessageFlags.Ephemeral})}else if(i.customId==="m_stop"){s.q=[];s.cur=null;s.p.stop(true);getVoiceConnection(i.guildId)?.destroy();await i.reply({content:"⏹️ Stopped.",flags:MessageFlags.Ephemeral})}}
});
c.login(process.env.DISCORD_TOKEN);
