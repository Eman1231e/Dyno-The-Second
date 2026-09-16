import { Client, GatewayIntentBits, Events } from "discord.js";
import "dotenv/config";

const OWNER_ID = "1139989614103380131";

if (!process.env.DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is missing. Add it as a Railway environment variable.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Dyno The 2nd is online as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  if (!message.mentions.users.has(OWNER_ID)) return;

  if (message.author.id === OWNER_ID) {
    await message.reply("Sir... that's literally you. 😭");
    return;
  }

  const responses = [
    "You have summoned Dyno. State your business.",
    "The 1st has been summoned.",
    "Dyno has been pinged. I'll notify management (him).",
    "Why are we pinging Dyno 🤨",
    "Your message has been forwarded to Dyno. Probably."
  ];

  await message.reply(responses[Math.floor(Math.random() * responses.length)]);
});

client.login(process.env.DISCORD_TOKEN);
