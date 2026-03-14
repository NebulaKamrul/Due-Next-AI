import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Inbox, ArrowLeft, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateICS, downloadICS } from "@/lib/ics";
import { loadResults, clearResults, StoredResults } from "@/lib/store";

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVars = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function ResultsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [results, setResults] = useState<StoredResults | null>(null);

  useEffect(() => {
    setResults(loadResults());
  }, []);

  const handleExport = () => {
    if (!results || results.assignments.length === 0) return;
    const icsString = generateICS(results.assignments, results.courseName);
    const filename = results.courseName
      ? `${results.courseName.toLowerCase().replace(/\s+/g, "-")}-assignments.ics`
      : "syllabus-assignments.ics";
    downloadICS(icsString, filename);
    toast({
      title: "Exported!",
      description: `${results.assignments.length} assignments downloaded.`,
    });
  };

  const handleClear = () => {
    clearResults();
    setResults(null);
  };

  const hasResults = results && results.assignments.length > 0;

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Extracted Assignments</h1>
            {results?.courseName && (
              <span className="inline-block mt-1.5 text-sm font-medium bg-muted px-2.5 py-0.5 rounded-md text-muted-foreground">
                {results.courseName}
              </span>
            )}
            {hasResults && (
              <p className="text-sm text-muted-foreground mt-1">
                {results.assignments.length} assignment{results.assignments.length !== 1 ? "s" : ""} found, sorted by due date
              </p>
            )}
          </div>

          {hasResults && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClear} className="text-muted-foreground">
                <Trash2 className="w-4 h-4 mr-1.5" />
                Clear
              </Button>
              <Button onClick={handleExport} className="shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                Export to Google Calendar
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {hasResults ? (
            <motion.div
              key="list"
              variants={containerVars}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3"
            >
              {results.assignments.map((assignment, idx) => (
                <motion.div key={`${assignment.name}-${idx}`} variants={itemVars}>
                  <AssignmentCard assignment={assignment} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/10"
            >
              <div className="bg-muted p-4 rounded-full mb-4">
                <Inbox className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No results yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">
                Upload or paste your syllabus on the Upload page to get started.
              </p>
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Upload
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
