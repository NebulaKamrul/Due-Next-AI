import { useState, useRef } from "react";
import { ArrowRight, X, File as FileIcon } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
  };

  const clearFile = () => {
    setFileName(null);
    setText("");
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text);
  };

  return (
    <div className="flex flex-col border border-border rounded-md bg-background overflow-hidden">
      <div className="relative">
        <Textarea
          placeholder="Paste syllabus text here..."
          className="min-h-[320px] w-full resize-none border-0 p-6 text-base bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50 rounded-none shadow-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isPending || isProcessingPdf}
        />
        
        {/* PDF Overlay indicator */}
        {fileName && (
          <div className="absolute top-4 left-4 right-4 bg-muted/50 border border-border rounded p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="truncate">
                <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={clearFile} disabled={isPending}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="bg-muted/20 border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isPending || isProcessingPdf}
          />
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground font-normal px-2 w-full sm:w-auto"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || isProcessingPdf}
          >
            {isProcessingPdf ? "Reading PDF..." : "Upload PDF file"}
          </Button>
        </div>
        
        <Button 
          onClick={handleSubmit} 
          disabled={!text.trim() || isPending || isProcessingPdf}
          className="w-full sm:w-auto"
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
    </div>
  );
}
