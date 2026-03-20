export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } }
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: typeof req.body === "string" ? req.body : JSON.stringify(req.body),
    });

    const text = await response.text();
    try {
      return res.status(response.status).json(JSON.parse(text));
    } catch {
      return res.status(response.status).send(text);
    }
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}