// This function is intentionally a single file with zero imports (no npm
// packages, no other files in this repo) - it's the one file Vercel bundles
// and deploys as a production serverless function in isolation, so it stays
// as close as possible to plain Node built-ins to avoid any ambiguity in how
// the deployment step handles cross-file references under /api. The local
// Express dev server (artifacts/api-server) has the equivalent logic and is
// free to import shared workspace packages normally, since it isn't deployed
// this way.

// Best-effort per-IP rate limit. In-memory, so it only protects within a
// single warm lambda instance - it resets on cold start and isn't shared
// across concurrent instances. That's enough to blunt a naive retry loop or
// script hitting one instance, but it is not a real defense against
// distributed abuse. For that, put a shared store (e.g. Upstash Redis) behind
// this instead.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitHits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  for (const [key, entry] of rateLimitHits) {
    if (entry.resetAt <= now) rateLimitHits.delete(key);
  }

  const entry = rateLimitHits.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimitHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function getClientIp(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.socket?.remoteAddress ?? "unknown";
}

interface ExtractedAssignment {
  name: string;
  dueDate: string;
  weight?: string | null;
  description?: string | null;
  needsReview?: boolean;
  dateHint?: string | null;
}

const MAX_INPUT_CHARS = 12000;
const MODEL = "gemini-2.5-flash-lite";
const MAX_COMPLETION_TOKENS = 8192;
const MAX_ATTEMPTS = 2;

function buildSystemPrompt(currentYear: number): string {
  return `You are an AI assistant that extracts assignment due dates from course syllabi.
Extract all assignments, exams, quizzes, projects, and other graded items with their due dates.

Return a JSON object with this exact structure:
{
  "courseName": "Course name if detectable, or null",
  "assignments": [
    {
      "name": "Assignment name",
      "dueDate": "YYYY-MM-DD format",
      "weight": "percentage or points if mentioned, or null",
      "description": "brief additional context if useful, or null",
      "needsReview": true or false,
      "dateHint": "the original ambiguous date text, or null"
    }
  ]
}

Rules:
- Include every graded item mentioned - quizzes, exams, homework, projects, papers, presentations, participation, all of it. Do not skip items just because the date is unclear.
- When a date is explicit and unambiguous (e.g. "October 20, 2026" or "10/20"), convert it to YYYY-MM-DD and set "needsReview": false.
- When a date is vague (e.g. "Week 5", "TBD", "mid-semester", a date range), make your best estimate using any other anchors in the text (term start date, other dated assignments, weekday patterns), still return a real YYYY-MM-DD date, but set "needsReview": true and put the original text verbatim in "dateHint" (e.g. "Week 5"). Never leave dueDate blank.
- Only omit an item entirely if there is truly no date information anywhere for it (not even a rough week or term reference) and no way to estimate one.
- Convert all dates to YYYY-MM-DD format, using 4-digit years.
- If a year is not specified, infer it from context (term dates, weekday/date pairs, other assignment years already present). If nothing anchors the year, assume the current academic year (${currentYear} or ${currentYear + 1} depending on whether the syllabus reads as a fall/winter/spring/summer term).
- The same assignment is often mentioned more than once (e.g. once in a grading table, again in a weekly schedule). List it only once, using the most specific date given.
- Normalize weight to a short string like "15%" or "20 pts" when mentioned; use null when no weight is given.
- Sort assignments chronologically by dueDate.
- Return valid JSON only, no markdown, no explanation, no trailing commas.`;
}

function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function isPlainAssignment(
  value: unknown,
): value is { name: string; dueDate: string; weight?: string | null; description?: string | null; needsReview?: unknown; dateHint?: unknown } {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return typeof a.name === "string" && a.name.trim().length > 0 && typeof a.dueDate === "string" && isValidISODate(a.dueDate);
}

function parseModelJson(rawContent: string): { courseName?: string | null; assignments?: unknown[] } {
  try {
    return JSON.parse(rawContent);
  } catch {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no-json");
    return JSON.parse(jsonMatch[0]);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  if (isRateLimited(getClientIp(req))) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
  }

  const { text } = req.body ?? {};

  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return res.status(400).json({ error: "Syllabus text is too short. Please paste more content." });
  }

  const currentYear = new Date().getFullYear();
  const trimmed = text.trim();
  const truncated = trimmed.length > MAX_INPUT_CHARS;
  const content = trimmed.slice(0, MAX_INPUT_CHARS);

  let response: Response | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_completion_tokens: MAX_COMPLETION_TOKENS,
          messages: [
            { role: "system", content: buildSystemPrompt(currentYear) },
            {
              role: "user",
              content: `Extract all due dates from this syllabus${
                truncated ? " (note: the text below was truncated to fit length limits - extract everything present, there may be more assignments not shown)" : ""
              }:\n\n${content}`,
            },
          ],
        }),
      });
    } catch (err) {
      console.error("Gemini API network error:", err);
      response = undefined;
    }

    if (response?.ok) break;
    if (response && response.status !== 429 && response.status < 500) break;
    if (attempt < MAX_ATTEMPTS) await sleep(500 * attempt);
  }

  if (!response || !response.ok) {
    const errBody = response ? await response.text().catch(() => "") : "";
    console.error("Gemini API error:", response?.status, errBody);
    return res.status(502).json({ error: "Failed to extract due dates. Please try again." });
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content ?? "{}";

  let parsed: { courseName?: string | null; assignments?: unknown[] };
  try {
    parsed = parseModelJson(rawContent);
  } catch {
    return res.status(502).json({ error: "Could not parse AI response. Please try again." });
  }

  const seen = new Set<string>();
  const assignments: ExtractedAssignment[] = (parsed.assignments ?? [])
    .filter(isPlainAssignment)
    .map((a) => ({
      name: a.name.trim(),
      dueDate: a.dueDate,
      weight: a.weight ?? null,
      description: a.description ?? null,
      needsReview: a.needsReview === true,
      dateHint: typeof a.dateHint === "string" ? a.dateHint : null,
    }))
    .filter((a) => {
      const key = `${a.name.toLowerCase()}|${a.dueDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return res.json({
    assignments,
    courseName: typeof parsed.courseName === "string" ? parsed.courseName : null,
  });
}
