import { Router, type IRouter } from "express";
import { extractDueDatesFromText, SyllabusExtractionError } from "@workspace/integrations-openai-ai-server";
import { ExtractDueDatesBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/extract", async (req, res) => {
  const parsed = ExtractDueDatesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body. Please provide syllabus text." });
    return;
  }

  try {
    const result = await extractDueDatesFromText(parsed.data.text);
    res.json(result);
  } catch (err) {
    if (err instanceof SyllabusExtractionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Error extracting due dates:", err);
    res.status(500).json({ error: "Failed to extract due dates. Please try again." });
  }
});

export default router;
