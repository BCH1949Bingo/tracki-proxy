// server.js mit OAuth2 Authorization Code Flow
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const config = {
  client_id: "bf6677e6-d489-4932-aa98-b01890b2793f",
  client_secret: "b95f862a26ed9d2e26f82530c9c747e8",
  redirect_uri: "https://tracki-proxy.onrender.com/callback",
  auth_url: "https://plus.trackimo.com/api/v2/oauth/authorize",
  token_url: "https://plus.trackimo.com/api/v2/oauth/token",
};

let accessToken = null;

// Root-Route für Render-Verfügbarkeit (verhindert 502-Fehler)
app.get("/", (req, res) => {
  res.send("✅ Tracki-Proxy läuft. Bitte zuerst /auth aufrufen.");
});

// Schritt 1: Weiterleitung zur Trackimo OAuth2-Anmeldeseite
app.get("/auth", (req, res) => {
  const authUrl = `${config.auth_url}?client_id=${config.client_id}&response_type=code&redirect_uri=${encodeURIComponent(config.redirect_uri)}`;
  res.redirect(authUrl);
});

// Schritt 2: Empfang des Auth-Codes und Umtausch gegen ein Access Token
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  try {
    const tokenResponse = await axios.post(config.token_url, {
      grant_type: "authorization_code",
      client_id: config.client_id,
      client_secret: config.client_secret,
      redirect_uri: config.redirect_uri,
      code: code,
    });
    accessToken = tokenResponse.data.access_token;
    res.send("✅ Erfolgreich verbunden! Du kannst nun /api/trackers aufrufen.");
  } catch (error) {
    res.status(500).send("❌ Token-Austausch fehlgeschlagen: " + JSON.stringify(error.response?.data || error.message));
  }
});

// Schritt 3: Tracker-Daten mit gültigem Access Token abrufen
app.get("/api/trackers", async (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ error: "❌ Bitte zuerst /auth aufrufen und Zugang gewähren." });
  }
  try {
    const response = await axios.get("https://plus.trackimo.com/api/v2/devices", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server läuft auf Port ${port}`);
});
