import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useExtractDueDates } from "@workspace/api-client-react";
import { CalendarRange, BookOpen, Clock, Sparkles, FileText } from "lucide-react";
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

const loadingMessages = [
  { text: "Reading your syllabus...", icon: FileText },
  { text: "Scanning for deadlines...", icon: BookOpen },
  { text: "Identifying assignments...", icon: Clock },
  { text: "Organizing your schedule...", icon: CalendarRange },
  { text: "Almost there...", icon: Sparkles },
];

function ExtractionLoader() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const current = loadingMessages[messageIndex];
  const Icon = current.icon;

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-24 gap-10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-full border-2 border-primary/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 w-24 h-24 rounded-full border-2 border-transparent border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={messageIndex}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="w-8 h-8 text-primary" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            className="font-display text-2xl text-foreground font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {current.text}
          </motion.p>
        </AnimatePresence>
        <p className="text-muted-foreground text-sm font-light">
          This usually takes a few seconds
        </p>
      </div>

      <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 12, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
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

  const isPending = extractMutation.isPending;

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.div key="loader" className="max-w-3xl mx-auto">
            <ExtractionLoader />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            className="max-w-3xl mx-auto flex flex-col gap-14"
            variants={containerVars}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
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
                Paste your syllabus or drop a PDF. We'll extract every deadline and export it to your calendar in{" "}
                <motion.span
                  className="font-display italic font-bold text-primary"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", damping: 18, stiffness: 80, delay: 1.0 }}
                >
                  seconds.
                </motion.span>
              </motion.p>
            </motion.div>

            <motion.div variants={fadeUpSlow}>
              <SyllabusForm onSubmit={handleExtract} isPending={isPending} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
