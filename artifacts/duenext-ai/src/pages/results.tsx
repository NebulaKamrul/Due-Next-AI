import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ArrowLeft, Plus, ArrowRight } from "lucide-react";
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
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Extracted Assignments</h1>
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
                <span className="text-sm text-muted-foreground">
                  {results.assignments.length} assignments found
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
                  <AssignmentCard assignment={assignment} onUpdate={(updated) => handleUpdateAssignment(idx, updated)} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-start py-12"
            >
              <h3 className="text-lg font-medium mb-2 text-foreground">No assignments extracted</h3>
              <p className="text-muted-foreground text-base max-w-sm mb-6">
                Go back and paste your syllabus text to extract dates.
              </p>
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Upload
              </Button>
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
              <p className="text-sm font-medium text-foreground">Got more syllabi?</p>
              <p className="text-sm text-muted-foreground">Upload another syllabus and export it too.</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              <Plus className="w-4 h-4 mr-2" />
              Upload another
            </Button>
          </motion.div>
        )}
      </motion.div>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export filename</DialogTitle>
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
              <DialogTitle className="text-lg">File downloaded!</DialogTitle>
              <p className="text-sm text-muted-foreground">
                No idea how to import a .ics file into your calendar?
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
                Show me how
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setShowPostExportDialog(false)}
              >
                I know what I'm doing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
