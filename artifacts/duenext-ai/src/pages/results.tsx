import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ArrowLeft, Plus, ArrowRight, Upload, Sparkles, CalendarRange, X, Pencil, Palette, Tag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateICS, downloadICS } from "@/lib/ics";
import { loadResults, clearResults, saveResults, StoredResults, EditableAssignment } from "@/lib/store";

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVars = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 120 } as const,
  },
};
const headerVars = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 100 } },
};

export default function ResultsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [results, setResults] = useState<StoredResults | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFilename, setExportFilename] = useState("");
  const [hasExported, setHasExported] = useState(false);
  const [showPostExportDialog, setShowPostExportDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(true);
  const [showTip, setShowTip] = useState(() => {
    return localStorage.getItem("duenext_tip_dismissed") !== "true";
  });

  useEffect(() => {
    setResults(loadResults());
    const t = setTimeout(() => setShowSuccess(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const defaultFilename = () => {
    if (results?.courseName) {
      return `${results.courseName.toLowerCase().replace(/\s+/g, "-")}-assignments`;
    }
    return "syllabus-assignments";
  };

  const openExportDialog = () => {
    setExportFilename(defaultFilename());
    setShowExportDialog(true);
  };

  const confirmExport = () => {
    if (!results || results.assignments.length === 0) return;
    const icsString = generateICS(results.assignments, results.courseName);
    const name = exportFilename.trim() || defaultFilename();
    const filename = name.endsWith(".ics") ? name : `${name}.ics`;
    downloadICS(icsString, filename);
    setShowExportDialog(false);
    setHasExported(true);
    setShowPostExportDialog(true);
  };

  const handleUpdateAssignment = (idx: number, updated: EditableAssignment) => {
    if (!results) return;
    const newAssignments = [...results.assignments];
    newAssignments[idx] = updated;
    const newResults = { ...results, assignments: newAssignments };
    setResults(newResults);
    saveResults(newResults);
  };

  const handleApplyColorToAll = (color: string | null) => {
    if (!results) return;
    const newAssignments = results.assignments.map((a) => ({ ...a, color }));
    const newResults = { ...results, assignments: newAssignments };
    setResults(newResults);
    saveResults(newResults);
  };

  const handleApplyColorToType = (color: string | null, type: string) => {
    if (!results) return;
    const newAssignments = results.assignments.map((a) =>
      (a.type ?? "assignment") === type ? { ...a, color } : a
    );
    const newResults = { ...results, assignments: newAssignments };
    setResults(newResults);
    saveResults(newResults);
  };

  const handleClear = () => {
    clearResults();
    setResults(null);
  };

  const hasResults = results && results.assignments.length > 0;

  return (
    <Layout>
      <motion.div
        className="flex flex-col gap-8"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
      >
        {/* Page header */}
        <motion.div variants={headerVars} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Your Assignments</h1>
              <AnimatePresence>
                {showSuccess && hasResults && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-green-500">
                      <motion.circle
                        cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="1.5" fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      <motion.path
                        d="M8 12l3 3 5-6"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {hasResults && (
              <div className="flex items-center gap-3 pt-1">
                {results?.courseName && (
                  <span className="text-sm font-medium text-foreground">
                    {results.courseName}
                  </span>
                )}
                {results?.courseName && <span className="text-muted-foreground">&middot;</span>}
                <span className="text-sm text-muted-foreground font-light">
                  {results.assignments.length} {results.assignments.length === 1 ? "deadline" : "deadlines"} extracted
                </span>
              </div>
            )}
          </div>

          {hasResults && (
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleClear} className="text-muted-foreground">
                Clear
              </Button>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Button onClick={openExportDialog}>
                  <Download className="w-4 h-4 mr-2" />
                  Export .ics
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {hasResults && showTip && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="overflow-hidden"
            >
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Tap any assignment to customize it
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {[
                      { icon: Pencil, text: "Edit title, date & weight" },
                      { icon: Palette, text: "Pick a color" },
                      { icon: Tag, text: "Set assignment type" },
                    ].map(({ icon: Icon, text }) => (
                      <span key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground font-light">
                        <Icon className="w-3 h-3 text-primary/60" />
                        {text}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTip(false);
                    localStorage.setItem("duenext_tip_dismissed", "true");
                  }}
                  className="text-muted-foreground/60 hover:text-foreground transition-colors p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence mode="wait">
          {hasResults ? (
            <motion.div
              key="list"
              variants={containerVars}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-px bg-border border border-border rounded-md"
            >
              {results.assignments.map((assignment, idx) => (
                <motion.div key={`${assignment.name}-${idx}`} variants={itemVars} className="bg-background">
                  <AssignmentCard
                    assignment={assignment}
                    onUpdate={(updated) => handleUpdateAssignment(idx, updated)}
                    onApplyColorToAll={handleApplyColorToAll}
                    onApplyColorToType={handleApplyColorToType}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 80 }}
              className="flex flex-col items-center text-center py-16 gap-10"
            >
              <div className="space-y-4">
                <h3 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">No deadlines yet</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto font-light leading-relaxed">
                  Upload your syllabus and we'll pull out every assignment and due date automatically.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                {[
                  { icon: Upload, label: "Upload syllabus" },
                  { icon: Sparkles, label: "AI extracts dates" },
                  { icon: CalendarRange, label: "Export to calendar" },
                ].map(({ icon: Icon, label }, i) => (
                  <motion.div
                    key={label}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground font-light">{label}</span>
                    {i < 2 && (
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 hidden sm:block ml-4" />
                    )}
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Button onClick={() => navigate("/")} size="lg" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload a Syllabus
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasExported && hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-border rounded-md p-5 bg-muted/20"
          >
            <div>
              <p className="text-sm font-medium text-foreground">Have another syllabus?</p>
              <p className="text-sm text-muted-foreground font-light">Upload it and we'll extract those deadlines too.</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Another
            </Button>
          </motion.div>
        )}
      </motion.div>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Name Your Export</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmExport()}
              placeholder="syllabus-assignments"
              className="flex-1"
              autoFocus
            />
            <span className="text-sm text-muted-foreground shrink-0">.ics</span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={confirmExport}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPostExportDialog} onOpenChange={setShowPostExportDialog}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="flex flex-col items-center gap-4 pt-2">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 150, delay: 0.1 }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-primary">
                <motion.circle
                  cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="1.5" fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6 }}
                />
                <motion.path
                  d="M8 12l3 3 5-6"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                />
              </svg>
            </motion.div>
            <div className="space-y-1">
              <DialogTitle className="font-display text-lg">You're all set.</DialogTitle>
              <p className="text-sm text-muted-foreground font-light">
                Need help importing the file into your calendar? I got you.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full pt-2">
              <Button
                className="w-full"
                onClick={() => {
                  setShowPostExportDialog(false);
                  navigate("/how-to-import");
                }}
              >
                Show Me How
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setShowPostExportDialog(false)}
              >
                I've got it, thanks
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
