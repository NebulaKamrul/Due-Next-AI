import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useExtractDueDates } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { SyllabusForm } from "@/components/SyllabusForm";
import { useToast } from "@/hooks/use-toast";
import { saveResults } from "@/lib/store";

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 25, stiffness: 120 },
  },
};

const fadeUpSlow = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 20, stiffness: 80, delay: 0.3 },
  },
};

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
      <motion.div
        className="max-w-2xl mx-auto flex flex-col gap-10"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <motion.div className="space-y-4 pt-8" variants={fadeUp}>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Upload your syllabus and we'll tell you what's{" "}
            <motion.span
              className="text-primary inline-block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.45 }}
            >
              due next.
            </motion.span>
          </h1>
          <motion.p
            className="text-muted-foreground text-lg leading-relaxed max-w-lg"
            variants={fadeUp}
          >
            Paste text or drop a PDF. We'll find every assignment and format it for your calendar.
          </motion.p>
        </motion.div>

        <motion.div variants={fadeUpSlow}>
          <SyllabusForm onSubmit={handleExtract} isPending={extractMutation.isPending} />
        </motion.div>
      </motion.div>
    </Layout>
  );
}
