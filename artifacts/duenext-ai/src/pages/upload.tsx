import { useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { useExtractDueDates } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { SyllabusForm } from "@/components/SyllabusForm";
import { useToast } from "@/hooks/use-toast";
import { saveResults } from "@/lib/store";

export default function UploadPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const extractMutation = useExtractDueDates({
    mutation: {
      onSuccess: (data) => {
        const sorted = [...data.assignments].sort((a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        saveResults({ assignments: sorted, courseName: data.courseName ?? null });
        navigate("/results");
      },
      onError: (error) => {
        toast({
          title: "Extraction Failed",
          description: error.message || "Couldn't extract due dates. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const handleExtract = (text: string) => {
    extractMutation.mutate({ data: { text } });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {/* Hero */}
        <div className="text-center space-y-3 pt-4">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Upload your syllabus and we'll tell you what's <span className="text-primary">due next.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
            Paste your syllabus or drop in a PDF — we'll extract every assignment and due date so you don't have to.
          </p>
        </div>

        {/* Form */}
        <SyllabusForm onSubmit={handleExtract} isPending={extractMutation.isPending} />

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          {[
            { step: "1", title: "Paste or upload", body: "Drop in your syllabus text or upload a PDF." },
            { step: "2", title: "AI extracts dates", body: "We find every assignment and due date automatically." },
            { step: "3", title: "Export to calendar", body: "Download a .ics file and import it in seconds." },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex flex-col gap-2 p-4 bg-muted/40 rounded-xl border border-border/40 text-center">
              <span className="text-2xl font-extrabold text-primary/50">{step}</span>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
