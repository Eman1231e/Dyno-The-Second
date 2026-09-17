import {
 Client,GatewayIntentBits,Events,SlashCommandBuilder,ActionRowBuilder,
 ButtonBuilder,ButtonStyle,EmbedBuilder,MessageFlags
} from "discord.js";
import {Player,useQueue} from "discord-player";
import {DefaultExtractors,SoundCloudExtractor} from "@discord-player/extractor";
import "dotenv/config";

const OWNER="1139989614103380131",TZ="America/Toronto",CD=300000;
const SCHOOL={1:["09:15","16:30"],2:["09:15","16:30"],3:["09:45","16:30"],4:["09:15","16:30"],5:["09:15","16:30"]};
let mode="auto",custom=null;const cds=new Map();
if(!process.env.DISCORD_TOKEN)throw Error("DISCORD_TOKEN missing");

const client=new Client({intents:[
 GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,
 GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates
]});
const player=new Player(client,{
  ffmpegPath:"/usr/bin/ffmpeg",
  skipFFmpeg:false
});
await player.extractors.loadMulti(DefaultExtractors);

function now(){let p=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:TZ,weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts().map(x=>[x.type,x.value]));return{d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[p.weekday],m:+p.hour*60 + +p.minute}}
const mm=s=>{let[h,m]=s.split(":").map(Number);return h*60+m};
function school(){let n=now(),s=SCHOOL[n.d];return !!s&&n.m>=mm(s[0])&&n.m<mm(s[1])}
function status(){return mode==="auto"?(school()?"school":"available"):mode}
function receptionist(){if(status()==="custom"&&custom)return custom;let f={school:"📚 Dyno is currently at school. He'll respond when he's available.",busy:"🔴 Dyno is currently busy. He'll get back to you when he can.",away:"🌙 Dyno is currently away. Your ping has been noted.",sleeping:"💤 Dyno is currently sleeping. Bro is NOT answering you right now 😭"};return f[status()]||["You have summoned Dyno. State your business.","The 1st has been summoned.","Why are we pinging Dyno 🤨","Your message has been forwarded to Dyno. Probably."][Math.floor(Math.random()*4)]}

function controls(){return[new ActionRowBuilder().addComponents(
 new ButtonBuilder().setCustomId("m_pause").setEmoji("⏯️").setStyle(ButtonStyle.Primary),
 new ButtonBuilder().setCustomId("m_skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
 new ButtonBuilder().setCustomId("m_loop").setEmoji("🔁").setStyle(ButtonStyle.Secondary),
 new ButtonBuilder().setCustomId("m_stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger)
)]}

player.events.on("playerStart",async(q,t)=>{
 const ch=q.metadata?.channel;if(!ch)return;
 await ch.send({embeds:[new EmbedBuilder().setTitle("🎵 Dyno The 2nd — Now Playing")
  .setDescription(`**${t.title}**\n${t.author||""}`)
  .setThumbnail(t.thumbnail||null)
  .setFooter({text:`Source: ${t.source || "audio"}`})],components:controls()}).catch(()=>{});
});
player.events.on("error",(q,e)=>console.error("[PLAYER ERROR]",e));
player.events.on("playerError",(q,e)=>console.error("[STREAM ERROR]",e));
player.on("debug",m=>console.log("[PLAYER DEBUG]",m));
player.events.on("debug",(q,m)=>console.log(`[QUEUE DEBUG ${q.guild.id}]`,m));

const cmds=[
 new SlashCommandBuilder().setName("dynostatus").setDescription("Set Dyno's receptionist status").addStringOption(o=>o.setName("status").setDescription("Status").setRequired(true).addChoices({name:"Automatic",value:"auto"},{name:"Available",value:"available"},{name:"School",value:"school"},{name:"Busy",value:"busy"},{name:"Away",value:"away"},{name:"Sleeping",value:"sleeping"},{name:"Custom",value:"custom"})).addStringOption(o=>o.setName("message").setDescription("Custom response")),
 new SlashCommandBuilder().setName("dynostatuscheck").setDescription("Check receptionist status"),
 new SlashCommandBuilder().setName("play").setDescription("Play or queue a song").addStringOption(o=>o.setName("query").setDescription("Song name or SoundCloud URL").setRequired(true)),
 new SlashCommandBuilder().setName("queue").setDescription("Show music queue"),
 new SlashCommandBuilder().setName("stopmusic").setDescription("Stop music and leave voice")
].map(x=>x.toJSON());

client.once(Events.ClientReady,async x=>{
 console.log(`Dyno The 2nd v1.6.6 online as ${x.user.tag}`);
 console.log(`Node ${process.version}`);
 console.log(player.scanDeps());
 await x.application.commands.set(cmds);console.log("Commands registered");
});

client.on(Events.MessageCreate,async m=>{
 if(m.author.bot||m.mentions.everyone||m.type===19)return;
 if(!new RegExp(`<@!?${OWNER}>`).test(m.content))return;
 // VIP receptionist overrides
 if(m.author.id==="1321552389957877840")
  return void await m.reply("Alex, please stop pinging Dyno. The server has enough load as it is. 💀");
 if(m.author.id==="1004078630353240186")
  return void await m.reply("Your Majesty, King Onyx. 👑 Dyno has received your royal summons. Please refrain from summoning him again before I have you removed from the kingdom. 😭");
 if(m.author.id===OWNER)return void await m.reply("Sir... that's literally you. 😭");
 let l=cds.get(m.author.id)||0;if(Date.now()-l<CD)return;cds.set(m.author.id,Date.now());
 await m.reply(receptionist());
});

client.on(Events.InteractionCreate,async i=>{
 if(i.isChatInputCommand()){
  if(["dynostatus","dynostatuscheck"].includes(i.commandName)&&i.user.id!==OWNER)
   return void await i.reply({content:"Nice try. These controls belong to Dyno. 😭",flags:MessageFlags.Ephemeral});
  if(i.commandName==="dynostatus"){
   let s=i.options.getString("status",true),m=i.options.getString("message");
   if(s==="custom"&&!m)return void await i.reply({content:"Custom needs a message.",flags:MessageFlags.Ephemeral});
   mode=s;custom=s==="custom"?m:null;
   return void await i.reply({content:`Receptionist set to **${s}**. Effective: **${status()}**.`,flags:MessageFlags.Ephemeral});
  }
  if(i.commandName==="dynostatuscheck")
   return void await i.reply({content:`Mode: **${mode}** • Effective: **${status()}** • School: **${school()?"yes":"no"}**`,flags:MessageFlags.Ephemeral});

  if(i.commandName==="play"){
   const vc=i.member?.voice?.channel;
   if(!vc)return void await i.reply({content:"Join a voice channel first 😭",flags:MessageFlags.Ephemeral});
   await i.deferReply();
   try{
    const query=i.options.getString("query",true);
    // Deliberately force the official SoundCloud extractor. No YouTube, yt-dlp or Python.
    const playPromise=player.play(vc,query,{
      requestedBy:i.user,
      nodeOptions:{
        metadata:{channel:i.channel},
        leaveOnEmpty:true,
        leaveOnEmptyCooldown:300000,
        leaveOnEnd:false,
        bufferingTimeout:15000,
        connectionTimeout:15000,
        disableFilterer:true,
        disableBiquad:true,
        disableEqualizer:true,
        disableVolume:true,
        disableResampler:true
      },
      searchEngine:`ext:${SoundCloudExtractor.identifier}`
    });
    const timeoutPromise=new Promise((_,reject)=>setTimeout(()=>reject(new Error("Audio pipeline timed out after 25 seconds.")),25000));
    const result=await Promise.race([playPromise,timeoutPromise]);
    await i.editReply(`▶️ ${result.track.title}`);
   }catch(e){
    console.error("[PLAY ERROR]",e);
    await i.editReply(`Music error: ${e?.message||String(e)}`);
   }
   return;
  }

  if(i.commandName==="queue"){
   const q=useQueue(i.guildId);
   if(!q)return void await i.reply("Queue is empty.");
   const upcoming=q.tracks.toArray().slice(0,10);
   const text=upcoming.map((t,n)=>`${n+1}. ${t.title}`).join("\n")||"Queue is empty.";
   return void await i.reply({embeds:[new EmbedBuilder().setTitle("🎵 Queue").setDescription(text)]});
  }
  if(i.commandName==="stopmusic"){
   const q=useQueue(i.guildId);if(q)q.delete();
   return void await i.reply("⏹️ Music stopped.");
  }
 }

 if(i.isButton()&&i.customId.startsWith("m_")){
  const q=useQueue(i.guildId);
  if(!q)return void await i.reply({content:"Nothing is playing.",flags:MessageFlags.Ephemeral});
  if(i.customId==="m_pause"){
   q.node.setPaused(!q.node.isPaused());
   await i.reply({content:"⏯️ Toggled pause.",flags:MessageFlags.Ephemeral});
  }else if(i.customId==="m_skip"){
   q.node.skip();await i.reply({content:"⏭️ Skipped.",flags:MessageFlags.Ephemeral});
  }else if(i.customId==="m_loop"){
   q.setRepeatMode(q.repeatMode===1?0:1);
   await i.reply({content:`🔁 Loop ${q.repeatMode===1?"on":"off"}.`,flags:MessageFlags.Ephemeral});
  }else if(i.customId==="m_stop"){
   q.delete();await i.reply({content:"⏹️ Stopped.",flags:MessageFlags.Ephemeral});
  }
 }
});
client.login(process.env.DISCORD_TOKEN);
