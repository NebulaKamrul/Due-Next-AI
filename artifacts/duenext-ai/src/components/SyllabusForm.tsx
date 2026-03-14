import { useState, useRef, useCallback } from "react";
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
        <div className="relative border border-border rounded-md bg-background overflow-hidden">
          <Textarea
            placeholder="Paste syllabus text here..."
            className="min-h-[200px] w-full resize-none border-0 p-5 text-base bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50 rounded-none shadow-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isPending || isProcessingPdf}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-border" />
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
              border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
              ${isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/20"
              }
              ${(isPending || isProcessingPdf) ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            <Upload className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isProcessingPdf ? "Reading PDF..." : "Drop a PDF here or click to browse"}
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!text.trim() || isPending || isProcessingPdf}
        className="w-full sm:w-auto self-end"
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
    </div>
  );
}
