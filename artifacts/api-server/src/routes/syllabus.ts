import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ExtractDueDatesBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/extract", async (req, res) => {
  try {
    const parsed = ExtractDueDatesBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body. Please provide syllabus text." });
      return;
    }

    const { text } = parsed.data;

    if (!text || text.trim().length < 10) {
      res.status(400).json({ error: "Syllabus text is too short. Please paste more content." });
      return;
    }

    const currentYear = new Date().getFullYear();

    const completion = await openai.chat.completions.create({
      model: "gemini-2.5-flash-lite",
      max_completion_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that extracts assignment due dates from course syllabi. 
Extract all assignments, exams, quizzes, projects, and other graded items with their due dates.

Return a JSON object with this exact structure:
{
  "courseName": "Course name if detectable, or null",
  "assignments": [
    {
      "name": "Assignment name",
      "dueDate": "YYYY-MM-DD format",
      "weight": "percentage or points if mentioned, or null",
      "description": "brief additional context if useful, or null"
    }
  ]
}

Rules:
- Only include items with a clear due date
- Convert all dates to YYYY-MM-DD format
- If a year is not specified, assume the current academic year (${currentYear} or ${currentYear + 1} depending on the semester context)
- Sort assignments chronologically by dueDate
- Be comprehensive - include all quizzes, exams, homework, projects, papers, presentations
- Return valid JSON only, no markdown, no explanation`
        },
        {
          role: "user",
          content: `Extract all due dates from this syllabus:\n\n${text.slice(0, 12000)}`
        }
      ]
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";

    let parsed2: { courseName?: string | null; assignments?: Array<{ name: string; dueDate: string; weight?: string | null; description?: string | null }> };
    try {
      parsed2 = JSON.parse(rawContent);
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed2 = JSON.parse(jsonMatch[0]);
      } else {
        res.status(500).json({ error: "Could not parse AI response. Please try again." });
        return;
      }
    }

    const assignments = (parsed2.assignments ?? []).map((a) => ({
      name: a.name,
      dueDate: a.dueDate,
      weight: a.weight ?? null,
      description: a.description ?? null,
    }));

    assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    res.json({
      assignments,
      courseName: parsed2.courseName ?? null,
    });
  } catch (err) {
    console.error("Error extracting due dates:", err);
    res.status(500).json({ error: "Failed to extract due dates. Please try again." });
  }
});

export default router;
