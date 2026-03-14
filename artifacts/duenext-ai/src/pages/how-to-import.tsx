import { useLocation } from "wouter";
import { ExternalLink } from "lucide-react";
import { Layout } from "@/components/Layout";

const steps = [
  {
    title: "Export the .ics file",
    body: (
      <>
        Go to the <strong>Results</strong> page and click <strong>Export .ics</strong>. 
        A file will download to your computer.
      </>
    ),
  },
  {
    title: "Open Google Calendar Settings",
    body: (
      <>
        Go to{" "}
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4 inline-flex items-center gap-1"
        >
          calendar.google.com <ExternalLink className="w-3 h-3" />
        </a>{" "}
        on a desktop browser. Click the gear icon in the top right, then select <strong>Settings</strong>.
      </>
    ),
  },
  {
    title: 'Go to "Import & Export"',
    body: (
      <>
        In the left sidebar, click <strong>Import &amp; Export</strong>. Then click{" "}
        <strong>Select file from your computer</strong> and choose your downloaded <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">.ics</code> file.
      </>
    ),
  },
  {
    title: "Choose a calendar and import",
    body: (
      <>
        Pick which of your calendars the events should go into, then click <strong>Import</strong>. Your assignments will appear as all-day events.
      </>
    ),
  },
];

export default function HowToImportPage() {
  const [, navigate] = useLocation();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto flex flex-col gap-10">
        <div className="space-y-4 pt-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            How to Import into Google Calendar
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Four quick steps to add extracted assignments to your calendar.
          </p>
        </div>

        <div className="flex flex-col">
          {steps.map(({ title, body }, i) => (
            <div
              key={i}
              className="flex gap-6 py-6 border-b border-border last:border-0"
            >
              <div className="text-sm font-mono text-muted-foreground pt-0.5">
                0{i + 1}
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">{title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed max-w-lg">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
          <strong>Note:</strong> Google Calendar's mobile app does not support .ics imports. You must do this from a desktop or laptop browser.
        </div>

        <p className="text-sm text-muted-foreground text-center pb-4">
          Got another syllabus?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            Click here to upload.
          </button>
        </p>
      </div>
    </Layout>
  );
}
