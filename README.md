# DueNext.ai

**DueNext.ai** is an AI-powered syllabus deadline extractor.

Paste your syllabus or upload a PDF, and DueNext automatically extracts every assignment and due date,
then exports everything to Google Calendar as an `.ics` file.

Students no longer need to manually scan long syllabi or miss deadlines buried in course documents. 

---

## Features

- Paste syllabus text or upload a **PDF**
- AI extracts **assignments, due dates, and weights automatically**
- Edit assignment **titles, dates, types, colors, and weights**
- **9 assignment types supported**
  - Assignment
  - Quiz
  - Test
  - Exam
  - Midterm
  - Final
  - Practical
  - Class Activity
  - Other
- Export directly to **Google Calendar** via `.ics`
- **Dark mode support**
- Smooth **premium UI animations** with Framer Motion

---

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Framer Motion

### Backend
- Express.js

### AI + Parsing
- OpenAI GPT-4o-mini
- pdfjs-dist (PDF parsing)

### Monorepo
- pnpm

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/duenext-ai.git
cd duenext-ai
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set environment variables

Create a `.env` file and add:

```
OPENAI_API_KEY=your_api_key_here
```

### 4. Run the development server

```bash
pnpm run dev
```

---

## How It Works

1. Upload or paste a course syllabus
2. AI extracts assignments and deadlines
3. Review and edit extracted items
4. Export everything as an `.ics` file
5. Import into **Google Calendar**

---

## Live Demo

https://duenextai.replit.app/

---

## Author

Built by **Nebula Kamrul**
