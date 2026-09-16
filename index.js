import {
  Client,
  GatewayIntentBits,
  Events,
  SlashCommandBuilder
} from "discord.js";
import "dotenv/config";

const OWNER_ID = "1139989614103380131";
const TIME_ZONE = "America/Toronto";

// School schedule, local Toronto/Niagara time.
// Mon/Tue/Thu/Fri: 9:15 AM–4:30 PM
// Wed: 9:45 AM–4:30 PM
const SCHOOL_SCHEDULE = {
  1: { start: "09:15", end: "16:30" }, // Monday
  2: { start: "09:15", end: "16:30" }, // Tuesday
  3: { start: "09:45", end: "16:30" }, // Wednesday
  4: { start: "09:15", end: "16:30" }, // Thursday
  5: { start: "09:15", end: "16:30" }  // Friday
};

let manualStatus = "auto";
let customMessage = null;

// Prevent one person from making the bot spam replies by repeatedly pinging Dyno.
const pingCooldowns = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;

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

function getLocalParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    day: dayMap[values.weekday],
    minutes: Number(values.hour) * 60 + Number(values.minute)
  };
}

function hhmmToMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function isSchoolTime() {
  const { day, minutes } = getLocalParts();
  const schedule = SCHOOL_SCHEDULE[day];
  if (!schedule) return false;

  return (
    minutes >= hhmmToMinutes(schedule.start) &&
    minutes < hhmmToMinutes(schedule.end)
  );
}

function activeStatus() {
  if (manualStatus !== "auto") return manualStatus;
  return isSchoolTime() ? "school" : "available";
}

function receptionistMessage() {
  const status = activeStatus();

  if (status === "custom" && customMessage) return customMessage;

  const messages = {
    school: "📚 Dyno is currently at school. He'll respond when he's available.",
    busy: "🔴 Dyno is currently busy. He'll get back to you when he can.",
    away: "🌙 Dyno is currently away. Your ping has been noted.",
    sleeping: "💤 Dyno is currently sleeping. Bro is NOT answering you right now 😭",
    available: null
  };

  if (messages[status]) return messages[status];

  const normal = [
    "You have summoned Dyno. State your business.",
    "The 1st has been summoned.",
    "Dyno has been pinged. I'll notify management (him).",
    "Why are we pinging Dyno 🤨",
    "Your message has been forwarded to Dyno. Probably."
  ];

  return normal[Math.floor(Math.random() * normal.length)];
}

const commands = [
  new SlashCommandBuilder()
    .setName("dynostatus")
    .setDescription("Set Dyno's receptionist status")
    .addStringOption(option =>
      option
        .setName("status")
        .setDescription("Choose your current status")
        .setRequired(true)
        .addChoices(
          { name: "Automatic", value: "auto" },
          { name: "Available", value: "available" },
          { name: "School", value: "school" },
          { name: "Busy", value: "busy" },
          { name: "Away", value: "away" },
          { name: "Sleeping", value: "sleeping" },
          { name: "Custom", value: "custom" }
        )
    )
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("Custom ping response (used with Custom)")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("dynostatuscheck")
    .setDescription("See Dyno's current receptionist status")
].map(command => command.toJSON());

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Dyno The 2nd is online as ${readyClient.user.tag}`);

  // Register globally. Discord may take a short while to show updated global commands.
  await readyClient.application.commands.set(commands);
  console.log("Dyno receptionist commands registered.");
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!["dynostatus", "dynostatuscheck"].includes(interaction.commandName)) return;

  if (interaction.user.id !== OWNER_ID) {
    await interaction.reply({
      content: "Nice try. These controls belong to Dyno. 😭",
      ephemeral: true
    });
    return;
  }

  if (interaction.commandName === "dynostatuscheck") {
    await interaction.reply({
      content:
        `Receptionist mode: **${manualStatus}**\n` +
        `Current effective status: **${activeStatus()}**\n` +
        `School detection right now: **${isSchoolTime() ? "yes" : "no"}**`,
      ephemeral: true
    });
    return;
  }

  const status = interaction.options.getString("status", true);
  const message = interaction.options.getString("message");

  if (status === "custom" && !message) {
    await interaction.reply({
      content: "Give me a message when you select **Custom**.",
      ephemeral: true
    });
    return;
  }

  manualStatus = status;
  customMessage = status === "custom" ? message : null;

  await interaction.reply({
    content:
      status === "auto"
        ? `Automatic mode enabled. Right now you're considered **${activeStatus()}**.`
        : `Receptionist status set to **${status}**.`,
    ephemeral: true
  });
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  // Receptionist responds ONLY to a direct @Dyno user mention typed in the message.
  // @everyone/@here, role mentions (even roles Dyno has), and replies to Dyno do not count.
  if (message.mentions.everyone) return;
  if (message.type === 19) return; // MessageType.Reply

  const directDynoMention = new RegExp(`<@!?${OWNER_ID}>`).test(message.content);
  if (!directDynoMention) return;

  if (message.author.id === OWNER_ID) {
    await message.reply("Sir... that's literally you. 😭");
    return;
  }

  const lastPing = pingCooldowns.get(message.author.id) ?? 0;
  const now = Date.now();

  if (now - lastPing < COOLDOWN_MS) return;
  pingCooldowns.set(message.author.id, now);

  await message.reply(receptionistMessage());
});

client.login(process.env.DISCORD_TOKEN);
