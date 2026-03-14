import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useExtractDueDates } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { SyllabusForm } from "@/components/SyllabusForm";
import { useToast } from "@/hooks/use-toast";
import { saveResults } from "@/lib/store";

function TypeWriter({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) {
      const cursorTimer = setTimeout(() => setShowCursor(false), 600);
      return () => clearTimeout(cursorTimer);
    }
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, 70 + Math.random() * 40);
    return () => clearTimeout(timer);
  }, [started, displayed, text]);

  return (
    <span className={className}>
      {displayed}
      {showCursor && started && (
        <span className="animate-pulse ml-[1px]">|</span>
      )}
    </span>
  );
}

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 28, stiffness: 100 },
  },
};

const fadeUpSlow = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 22, stiffness: 70, delay: 0.35 },
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
        className="max-w-2xl mx-auto flex flex-col gap-12"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <motion.div className="space-y-5 pt-4" variants={fadeUp}>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
            Upload your syllabus and we'll tell you what's{" "}
            <TypeWriter text="due next." delay={600} className="text-primary italic" />
          </h1>
          <motion.p
            className="text-muted-foreground text-lg leading-relaxed max-w-md"
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
