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
    transition: { staggerChildren: 0.18, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 30, stiffness: 90 },
  },
};

const fadeUpSlow = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 24, stiffness: 65, delay: 0.3 },
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
          title: "Something went wrong",
          description: error.message || "We couldn't extract the dates. Please try again.",
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
        className="max-w-3xl mx-auto flex flex-col gap-14"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <motion.div className="space-y-5 pt-4" variants={fadeUp}>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight text-foreground leading-[1.08]">
            Upload your syllabus and we'll tell you what's{" "}
            <TypeWriter text="due next." delay={600} className="text-primary italic" />
          </h1>
          <motion.p
            className="text-muted-foreground text-xl leading-relaxed max-w-lg font-light"
            variants={fadeUp}
          >
            Paste your syllabus or drop a PDF. We'll extract every deadline and format it for your calendar, {" "}
            <motion.span
              className="font-display italic text-primary font-bold"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 80, delay: 1.2 }}
            >
              effortlessly.
            </motion.span>
          </motion.p>
        </motion.div>

        <motion.div variants={fadeUpSlow}>
          <SyllabusForm onSubmit={handleExtract} isPending={extractMutation.isPending} />
        </motion.div>
      </motion.div>
    </Layout>
  );
}
