import type { VercelRequest, VercelResponse } from "@vercel/node";
// Relative imports (not the `@workspace/*` package names) are used deliberately here:
// this file is bundled by Vercel's serverless function builder, which resolves the
// import graph by real file path. Going through the workspace package name would
// route through a pnpm symlink to another package's raw TypeScript source, which is
// an easy way to get inconsistent bundling behavior between environments.
import { ExtractDueDatesBody } from "../../lib/api-zod/src/generated/api";
import { extractDueDatesFromText, SyllabusExtractionError } from "../../lib/integrations-openai-ai-server/src/syllabus";
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
