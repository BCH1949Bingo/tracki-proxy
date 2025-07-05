const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const config = {
  client_id: "bf6677e6-d489-4932-aa98-b01890b2793f",
  client_secret: "b95f862a26ed9d2e26f82530c9c747e8",
  redirect_uri: "https://plus.trackimo.com/api/internal/v1/oauth_redirect"
};

let accessToken = null;

// Beispiel: statisches Token holen (normalerweise müsste man OAuth2 autorisieren)
async function getAccessToken() {
  try {
    const response = await axios.post("https://plus.trackimo.com/api/v2/oauth/token", {
      client_id: config.client_id,
      client_secret: config.client_secret,
      grant_type: "client_credentials"
    });
    accessToken = response.data.access_token;
  } catch (error) {
    console.error("Token error:", error.response?.data || error.message);
  }
}

async function fetchTrackerPositions() {
  if (!accessToken) {
    await getAccessToken();
  }

  try {
    const response = await axios.get("https://plus.trackimo.com/api/v2/devices", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data;
  } catch (error) {
    console.error("API error:", error.response?.data || error.message);
    return [];
  }
}

app.get("/api/trackers", async (req, res) => {
  const positions = await fetchTrackerPositions();
  res.json(positions);
});

app.listen(port, () => {
  console.log(`Tracki proxy server running on port ${port}`);
});