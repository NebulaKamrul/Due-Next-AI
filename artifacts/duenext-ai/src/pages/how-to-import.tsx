import { Download, Settings, FolderInput, ExternalLink } from "lucide-react";
import { Layout } from "@/components/Layout";

const steps = [
  {
    number: "01",
    icon: Download,
    title: "Export the .ics file",
    body: (
      <>
        Go to the <strong>Results</strong> page and click <strong>Export to Google Calendar</strong>. 
        A file called <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">syllabus-assignments.ics</code> will download to your computer.
      </>
    ),
  },
  {
    number: "02",
    icon: Settings,
    title: "Open Google Calendar Settings",
    body: (
      <>
        Go to{" "}
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5"
        >
          calendar.google.com <ExternalLink className="w-3 h-3" />
        </a>{" "}
        on a <strong>desktop browser</strong>. Click the gear icon ⚙️ in the top right, then select <strong>Settings</strong>.
      </>
    ),
  },
  {
    number: "03",
    icon: FolderInput,
    title: 'Go to "Import & Export"',
    body: (
      <>
        In the left sidebar, click <strong>Import &amp; Export</strong>. Then click{" "}
        <strong>Select file from your computer</strong> and choose your <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">.ics</code> file.
      </>
    ),
  },
  {
    number: "04",
    icon: Settings,
    title: "Choose a calendar and import",
    body: (
      <>
        Pick which of your calendars the events should go into (e.g. your personal calendar or a class-specific one), then click <strong>Import</strong>. All your assignments will appear as all-day events instantly.
      </>
    ),
  },
];

export default function HowToImportPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {/* Page header */}
        <div className="pt-2">
          <h1 className="text-2xl font-bold tracking-tight">How to Import into Google Calendar</h1>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            Follow these four steps to add your extracted assignments to Google Calendar.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-4">
          {steps.map(({ number, icon: Icon, title, body }) => (
            <div
              key={number}
              className="flex gap-5 p-5 bg-card border border-border/50 rounded-xl shadow-sm"
            >
              {/* Step number + icon */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="bg-primary/10 text-primary rounded-lg p-2.5">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-muted-foreground/60 tabular-nums">{number}</span>
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1 pt-1">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <span className="text-lg leading-none">⚠️</span>
          <p>
            <strong>Desktop only:</strong> Google Calendar's mobile app does not support .ics imports. You must do this from a desktop or laptop browser.
          </p>
        </div>
      </div>
    </Layout>
  );
}
