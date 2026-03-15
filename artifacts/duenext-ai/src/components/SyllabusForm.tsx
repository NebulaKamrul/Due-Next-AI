import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Upload, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { extractTextFromPDF } from "@/lib/pdf";

interface SyllabusFormProps {
  onSubmit: (text: string) => void;
  isPending: boolean;
}

export function SyllabusForm({ onSubmit, isPending }: SyllabusFormProps) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processPdf = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF document.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPdf(true);
    setFileName(file.name);

    try {
      const extractedText = await extractTextFromPDF(file);
      if (!extractedText.trim()) {
        throw new Error("No readable text found in PDF.");
      }
      setText(extractedText);
      toast({
        title: "PDF Parsed",
        description: "Text extracted. You can review and extract dates.",
      });
    } catch (error) {
      console.error(error);
      setFileName(null);
      toast({
        title: "Failed to read PDF",
        description: error instanceof Error ? error.message : "Could not extract text.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [toast]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPdf(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processPdf(file);
  }, [processPdf]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const clearFile = () => {
    setFileName(null);
    setText("");
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {/* Textarea */}
        <div className="relative border border-border rounded-lg bg-background overflow-hidden shadow-sm glow-focus transition-all duration-300">
          <Textarea
            placeholder="Paste syllabus text here..."
            className="min-h-[200px] w-full resize-none border-0 p-6 text-base bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40 placeholder:italic rounded-none shadow-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isPending || isProcessingPdf}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] font-medium">or</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Drop zone */}
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isPending || isProcessingPdf}
        />

        {fileName ? (
          <div className="border border-border rounded-md bg-muted/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={clearFile} disabled={isPending}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200
              ${isDragging
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border/60 hover:border-primary/30 hover:bg-muted/10 hover:shadow-sm"
              }
              ${(isPending || isProcessingPdf) ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/70">
                {isProcessingPdf ? "Reading PDF..." : "Drop a PDF here"}
              </p>
              {!isProcessingPdf && (
                <p className="text-xs text-muted-foreground/50 mt-0.5">or click to browse files</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Shimmer loading */}
      {isPending && (
        <div className="flex flex-col gap-2">
          <div className="h-3 w-3/4 rounded shimmer-skeleton" />
          <div className="h-3 w-1/2 rounded shimmer-skeleton" />
          <div className="h-3 w-2/3 rounded shimmer-skeleton" />
        </div>
      )}

      {/* Submit */}
      <motion.div
        className="w-full sm:w-auto self-end"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isPending || isProcessingPdf}
          className="w-full"
        >
          {isPending ? (
            <>
              <div className="w-3.5 h-3.5 mr-2 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              Extracting
            </>
          ) : (
            <>
              Extract Dates
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
