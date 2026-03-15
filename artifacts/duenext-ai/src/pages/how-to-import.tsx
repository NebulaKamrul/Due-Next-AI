import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ExternalLink, Download, Globe, Upload, CalendarCheck } from "lucide-react";
import { Layout } from "@/components/Layout";

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
    }, 55 + Math.random() * 35);
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

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 28, stiffness: 80 },
  },
};

const stepVars = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 70 },
  },
};

export default function HowToImportPage() {
  const [, navigate] = useLocation();

  return (
    <Layout>
      <motion.div
        className="max-w-3xl mx-auto flex flex-col gap-10"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <motion.div className="space-y-4 pt-8" variants={fadeUp}>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.08]">
            <TypeWriter text="Import to Google Calendar" delay={200} />
          </h1>
          <motion.p
            className="text-muted-foreground text-xl leading-relaxed font-light"
            variants={fadeUp}
          >
            Four simple steps to get your deadlines where they belong.
          </motion.p>
        </motion.div>

        <motion.div className="flex flex-col" variants={containerVars}>
          {steps.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={i}
              className="flex gap-5 py-7 border-b border-border last:border-0 group"
              variants={stepVars}
              whileHover={{ x: 6 }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
            >
              <motion.div
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"
                whileHover={{ scale: 1.15, backgroundColor: "hsl(var(--primary) / 0.2)" }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
              >
                <Icon className="w-4.5 h-4.5 text-primary" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-medium text-foreground">{title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed max-w-lg font-light">{body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="bg-muted/30 border border-border rounded-xl p-5 text-sm text-muted-foreground font-light"
          variants={fadeUp}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        >
          <strong className="font-medium">Please note —</strong> Google Calendar's mobile app doesn't support .ics imports. Use a desktop browser for this step.
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground text-center pb-4 font-light"
          variants={fadeUp}
        >
          Have another syllabus?{" "}
          <motion.button
            onClick={() => navigate("/")}
            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Upload it here.
          </motion.button>
        </motion.p>
      </motion.div>
    </Layout>
  );
}
