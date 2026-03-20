const https = require("https");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const bodyStr = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(bodyStr),
        },
      };

      const apiReq = https.request(options, (apiRes) => {
        let raw = "";
        apiRes.on("data", (chunk) => { raw += chunk; });
        apiRes.on("end", () => resolve({ status: apiRes.statusCode, body: raw }));
      });

      apiReq.on("error", reject);
      apiReq.write(bodyStr);
      apiReq.end();
    });

    try {
      return res.status(data.status).json(JSON.parse(data.body));
    } catch {
      return res.status(data.status).send(data.body);
    }
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
};