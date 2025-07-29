require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  console.log('💬 채널 ID:', message.channel.id);
  console.log('📥 감지됨:', message.content);

  if (message.author.bot) return;
  if (message.channel.id !== process.env.TARGET_CHANNEL_ID) return;

  const body = message.content;

  const shouldTrigger = true;
  console.log(`📌 감지 조건 통과 여부: ${shouldTrigger}`);

  if (shouldTrigger) {
    try {
      const res = await fetch(process.env.N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      console.log(`✅ Sent to n8n: ${res.status}`);
    } catch (err) {
      console.error('❌ 전송 실패:', err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

