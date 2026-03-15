import { useLocation } from "wouter";
import { ExternalLink, Download, Globe, Upload, CalendarCheck } from "lucide-react";
import { Layout } from "@/components/Layout";

const steps = [
  {
    icon: Download,
    title: "Export your .ics file",
    body: (
      <>
        Head to the <strong>Results</strong> page and tap <strong>Export .ics</strong>. 
        The file will save to your device instantly.
      </>
    ),
  },
  {
    icon: Globe,
    title: "Open Google Calendar",
    body: (
      <>
        Navigate to{" "}
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4 inline-flex items-center gap-1"
        >
          calendar.google.com <ExternalLink className="w-3 h-3" />
        </a>{" "}
        on a desktop browser. Open the gear icon, then select <strong>Settings</strong>.
      </>
    ),
  },
  {
    icon: Upload,
    title: "Import & Export",
    body: (
      <>
        In the left sidebar, select <strong>Import &amp; Export</strong>. Choose{" "}
        <strong>Select file from your computer</strong> and pick your <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">.ics</code> file.
      </>
    ),
  },
  {
    icon: CalendarCheck,
    title: "Select your calendar",
    body: (
      <>
        Choose which calendar the events belong to, then hit <strong>Import</strong>. Your deadlines will appear right on your calendar.
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
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Import to Google Calendar
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed font-light">
            Four simple steps to get your deadlines where they belong.
          </p>
        </div>

        <div className="flex flex-col">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <div
              key={i}
              className="flex gap-5 py-6 border-b border-border last:border-0"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-medium text-foreground">{title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed max-w-lg font-light">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/30 border border-border rounded-md p-4 text-sm text-muted-foreground font-light">
          <strong className="font-medium">Please note —</strong> Google Calendar's mobile app doesn't support .ics imports. Use a desktop browser for this step.
        </div>

        <p className="text-sm text-muted-foreground text-center pb-4 font-light">
          Have another syllabus?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors font-medium"
          >
            Upload it here.
          </button>
        </p>
      </div>
    </Layout>
  );
}
