import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ExtractDueDatesBody } from "@workspace/api-zod";
import { extractDueDatesFromText, SyllabusExtractionError } from "@workspace/integrations-openai-ai-server";
import { getClientIp, isRateLimited } from "../_lib/rate-limit";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "API key not configured." });
  }

  if (isRateLimited(getClientIp(req))) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
  }

  const parsed = ExtractDueDatesBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body. Please provide syllabus text." });
  }

  try {
    const result = await extractDueDatesFromText(parsed.data.text);
    return res.json(result);
  } catch (err) {
    if (err instanceof SyllabusExtractionError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Error extracting due dates:", err);
    return res.status(500).json({ error: "Failed to extract due dates. Please try again." });
  }
}
