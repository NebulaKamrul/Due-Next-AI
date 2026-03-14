import { useLocation } from "wouter";
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
      <div className="max-w-2xl mx-auto flex flex-col gap-10">
        {/* Hero */}
        <div className="space-y-4 pt-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Upload your syllabus and we'll tell you what's <span className="text-primary">due next.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
            Paste text or drop a PDF. We'll find every assignment and format it for your calendar.
          </p>
        </div>

        {/* Form */}
        <SyllabusForm onSubmit={handleExtract} isPending={extractMutation.isPending} />
      </div>
    </Layout>
  );
}
