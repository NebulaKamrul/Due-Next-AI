import { useState, useRef } from "react";
import { FileUp, Sparkles, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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
        title: "PDF Parsed Successfully",
        description: "Review the text below and click Extract.",
      });
    } catch (error) {
      console.error(error);
      setFileName(null);
      toast({
        title: "Failed to read PDF",
        description: error instanceof Error ? error.message : "Could not extract text. Please paste it manually.",
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
    <Card className="p-1 shadow-md border-border/60 bg-card overflow-hidden">
      <div className="relative">
        <Textarea
          placeholder="Paste your syllabus text here..."
          className="min-h-[280px] w-full resize-none border-0 p-6 text-base bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isPending || isProcessingPdf}
        />
        
        {/* PDF Overlay indicator */}
        {fileName && (
          <div className="absolute top-4 left-4 right-4 bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-primary/10 p-2 rounded-md shrink-0">
                <FileIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">Text extracted. You can edit before submitting.</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="shrink-0 rounded-full" onClick={clearFile} disabled={isPending}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="bg-muted/30 border-t border-border/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
            variant="outline"
            className="text-muted-foreground bg-white hover:bg-muted/50 transition-colors w-full sm:w-auto"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || isProcessingPdf}
          >
            <FileUp className="w-4 h-4 mr-2" />
            {isProcessingPdf ? "Reading PDF..." : "Upload PDF"}
          </Button>
        </div>
        
        <Button 
          size="lg" 
          onClick={handleSubmit} 
          disabled={!text.trim() || isPending || isProcessingPdf}
          className="w-full sm:w-auto shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Extract Due Dates
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
