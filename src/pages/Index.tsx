import { PdfUploader } from "@/components/PdfUploader";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Quiz Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your PDF document and let AI generate an interactive quiz to test your knowledge
          </p>
        </div>
        
        <PdfUploader />
      </div>
    </div>
  );
};

export default Index;
