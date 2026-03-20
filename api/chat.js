import https from "https";

export default async function handler(req, res) {
  console.log("[chat] method:", req.method);
  console.log("[chat] API key set:", !!process.env.ANTHROPIC_API_KEY);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    let bodyStr;
    if (typeof req.body === "string") {
      bodyStr = req.body;
    } else if (req.body && typeof req.body === "object") {
      bodyStr = JSON.stringify(req.body);
    } else {
      bodyStr = await new Promise((resolve) => {
        let raw = "";
        req.on("data", (chunk) => { raw += chunk; });
        req.on("end", () => resolve(raw));
      });
    }

    console.log("[chat] bodyStr length:", bodyStr ? bodyStr.length : 0);

    if (!bodyStr) {
      return res.status(400).json({ error: { message: "Empty request body" } });
    }

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
        apiRes.on("end", () => {
          console.log("[chat] Anthropic status:", apiRes.statusCode);
          resolve({ status: apiRes.statusCode, body: raw });
        });
      });

      apiReq.on("error", (e) => {
        console.error("[chat] https error:", e.message);
        reject(e);
      });

      apiReq.write(bodyStr);
      apiReq.end();
    });

    try {
      return res.status(data.status).json(JSON.parse(data.body));
    } catch {
      return res.status(data.status).send(data.body);
    }
  } catch (e) {
    console.error("[chat] caught error:", e.message);
    return res.status(500).json({ error: { message: e.message } });
  }
}
