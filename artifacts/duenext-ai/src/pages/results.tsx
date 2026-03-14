import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateICS, downloadICS } from "@/lib/ics";
import { loadResults, clearResults, StoredResults } from "@/lib/store";

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVars = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "tween", ease: "easeOut", duration: 0.2 } },
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
      title: "Exported",
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
      <div className="flex flex-col gap-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Extracted Assignments</h1>
            {hasResults && (
              <div className="flex items-center gap-3 pt-1">
                {results?.courseName && (
                  <span className="text-sm font-medium text-foreground">
                    {results.courseName}
                  </span>
                )}
                {results?.courseName && <span className="text-muted-foreground">·</span>}
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
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export .ics
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
              className="flex flex-col gap-px bg-border border border-border rounded-md overflow-hidden"
            >
              {results.assignments.map((assignment, idx) => (
                <motion.div key={`${assignment.name}-${idx}`} variants={itemVars} className="bg-background">
                  <AssignmentCard assignment={assignment} />
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
      </div>
    </Layout>
  );
}
