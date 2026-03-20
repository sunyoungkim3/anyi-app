const https = require("https");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  return new Promise((resolve) => {
    let rawBody = "";
    req.on("data", (chunk) => { rawBody += chunk; });
    req.on("end", () => {
      try {
        const body = rawBody;

        const options = {
          hostname: "api.anthropic.com",
          path: "/v1/messages",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Length": Buffer.byteLength(body),
          },
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = "";
          apiRes.on("data", (chunk) => { data += chunk; });
          apiRes.on("end", () => {
            try {
              res.status(apiRes.statusCode).json(JSON.parse(data));
            } catch {
              res.status(500).json({ error: { message: data } });
            }
            resolve();
          });
        });

        apiReq.on("error", (e) => {
          res.status(500).json({ error: { message: e.message } });
          resolve();
        });

        apiReq.write(body);
        apiReq.end();
      } catch (e) {
        res.status(500).json({ error: { message: e.message } });
        resolve();
      }
    });
  });
};