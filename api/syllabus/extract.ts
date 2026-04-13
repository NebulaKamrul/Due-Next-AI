export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body ?? {};

  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return res.status(400).json({ error: "Syllabus text is too short. Please paste more content." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  const currentYear = new Date().getFullYear();

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
- Return valid JSON only, no markdown, no explanation`,
          },
          {
            role: "user",
            content: `Extract all due dates from this syllabus:\n\n${text.slice(0, 12000)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return res.status(500).json({ error: "Failed to extract due dates. Please try again." });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: {
      courseName?: string | null;
      assignments?: Array<{ name: string; dueDate: string; weight?: string | null; description?: string | null }>;
    };

    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return res.status(500).json({ error: "Could not parse AI response. Please try again." });
      }
    }

    const assignments = (parsed.assignments ?? []).map((a) => ({
      name: a.name,
      dueDate: a.dueDate,
      weight: a.weight ?? null,
      description: a.description ?? null,
    }));

    assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return res.json({
      assignments,
      courseName: parsed.courseName ?? null,
    });
  } catch (err) {
    console.error("Error extracting due dates:", err);
    return res.status(500).json({ error: "Failed to extract due dates. Please try again." });
  }
}
