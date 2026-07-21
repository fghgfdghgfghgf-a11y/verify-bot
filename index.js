require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const fetch = require('node-fetch');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const DISCORD_SERVER_URL = process.env.DISCORD_SERVER_URL || "https://discord.gg/zj5UKDY6zy";
const PUBLIC_URL = process.env.PUBLIC_URL;

client.on('ready', () => console.log(`✅ Bot connecté !`));

app.get('/verify', (req, res) => {
  const authUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(PUBLIC_URL + '/callback')}&response_type=code&scope=identify%20email`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP inconnue';

  if (!code) return res.redirect(DISCORD_SERVER_URL);

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: PUBLIC_URL + '/callback',
      })
    });

    const oauthData = await tokenRes.json();
    if (oauthData.error) throw new Error(oauthData.error);

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${oauthData.access_token}` }
    });
    const user = await userRes.json();

    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      logChannel.send(`✅ **Vérif** → ${user.username || user.global_name} (${user.id}) | IP: ${ip}`);
    }

    res.redirect(DISCORD_SERVER_URL);
  } catch (e) {
    console.error(e);
    res.redirect(DISCORD_SERVER_URL);
  }
});

client.login(BOT_TOKEN);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Serveur sur port ${PORT}`));