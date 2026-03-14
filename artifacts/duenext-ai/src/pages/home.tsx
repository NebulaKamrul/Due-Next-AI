import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarRange, Download, Inbox, ChevronRight } from "lucide-react";
import { useExtractDueDates } from "@workspace/api-client-react";
import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";
import { SyllabusForm } from "@/components/SyllabusForm";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateICS, downloadICS } from "@/lib/ics";

export default function Home() {
  const { toast } = useToast();
  const [hasSearched, setHasSearched] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courseName, setCourseName] = useState<string | null>(null);

  const extractMutation = useExtractDueDates({
    mutation: {
      onSuccess: (data) => {
        // Sort assignments by date chronologically
        const sorted = [...data.assignments].sort((a, b) => {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        setAssignments(sorted);
        setCourseName(data.courseName ?? null);
        setHasSearched(true);
        
        // Scroll to results smoothly
        setTimeout(() => {
          document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      },
      onError: (error) => {
        toast({
          title: "Extraction Failed",
          description: error.message || "We couldn't extract due dates from this text. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const handleExtract = (text: string) => {
    extractMutation.mutate({ data: { text } });
  };

  const handleExport = () => {
    if (assignments.length === 0) return;
    const icsString = generateICS(assignments, courseName);
    const filename = courseName 
      ? `${courseName.toLowerCase().replace(/\s+/g, '-')}-assignments.ics` 
      : 'syllabus-assignments.ics';
    downloadICS(icsString, filename);
    
    toast({
      title: "Export Successful",
      description: `Downloaded ${assignments.length} assignments to your calendar.`,
    });
  };

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFE] selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
              <CalendarRange className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">DueNext AI</span>
          </div>
          
          <AnimatePresence>
            {hasSearched && assignments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex hover:bg-muted/50">
                  <Download className="w-4 h-4 mr-2" />
                  Export .ics
                </Button>
                <Button variant="outline" size="icon" onClick={handleExport} className="sm:hidden">
                  <Download className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col gap-16">
        
        {/* Hero & Input Section */}
        <section className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Never miss a <span className="text-primary">deadline.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Paste your syllabus text or upload a PDF. We'll extract your assignments, due dates, and weights instantly.
            </p>
          </div>

          <SyllabusForm onSubmit={handleExtract} isPending={extractMutation.isPending} />
        </section>

        {/* Results Section */}
        <div id="results-section" className="scroll-mt-24">
          <AnimatePresence mode="wait">
            {hasSearched && (
              <motion.section
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full flex flex-col gap-6"
              >
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Extracted Assignments</h2>
                    {courseName && (
                      <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                        <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded-md">{courseName}</span>
                      </div>
                    )}
                  </div>
                  
                  {assignments.length > 0 && (
                    <Button onClick={handleExport} className="w-full sm:w-auto shadow-sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export to Google Calendar
                    </Button>
                  )}
                </div>

                {/* Results List or Empty State */}
                {assignments.length > 0 ? (
                  <motion.div 
                    variants={containerVars} 
                    initial="hidden" 
                    animate="show" 
                    className="grid grid-cols-1 gap-4"
                  >
                    {assignments.map((assignment, idx) => (
                      <motion.div key={`${assignment.name}-${idx}`} variants={itemVars}>
                        <AssignmentCard assignment={assignment} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-border/60 rounded-2xl bg-muted/10"
                  >
                    <div className="bg-muted p-4 rounded-full mb-4">
                      <Inbox className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No assignments found</h3>
                    <p className="text-muted-foreground max-w-md">
                      We couldn't find any clear dates or assignments in that text. Try pasting a different section of the syllabus.
                    </p>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}
