import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const PdfUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    toast.success("PDF uploaded successfully!");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("File removed");
  };

  const handleGenerateQuiz = async () => {
    if (!file) return;

    setIsExtracting(true);
    setExtractedText(null);

    try {
      console.log('Extracting text from PDF...');
      
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('extract-pdf-text', {
        body: formData,
      });

      if (error) {
        console.error('Error calling extract-pdf-text function:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Text extracted successfully:', data);
      setExtractedText(data.text);
      
      toast.success(`Successfully extracted text from ${data.pages} pages!`);
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      toast.error('Failed to extract text from PDF. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />

      {!file ? (
        <Card
          className={`border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? "border-primary bg-secondary/50 shadow-lg"
              : "border-border bg-card hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-6">
                <Upload className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Upload your PDF document
              </h3>
              <p className="text-muted-foreground">
                Drag and drop your PDF here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Maximum file size: 10MB
              </p>
            </div>
            <Button
              onClick={handleButtonClick}
              size="lg"
              className="mt-4"
            >
              <Upload className="mr-2 h-5 w-5" />
              Choose PDF File
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="bg-card border-border shadow-md">
            <div className="p-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">
                    {file.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </Card>

          <Button
            onClick={handleGenerateQuiz}
            size="lg"
            className="w-full"
            disabled={isExtracting}
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Extracting Text...
              </>
            ) : (
              'Generate Quiz from PDF'
            )}
          </Button>

          {extractedText && (
            <Card className="bg-card border-border mt-4">
              <div className="p-6">
                <h4 className="font-semibold text-foreground mb-3">
                  Extracted Text Preview
                </h4>
                <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {extractedText.substring(0, 1000)}
                    {extractedText.length > 1000 && '...'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total characters: {extractedText.length.toLocaleString()}
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
