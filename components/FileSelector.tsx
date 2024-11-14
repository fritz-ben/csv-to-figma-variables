import React, { useState } from "react";
import { Upload, FileJson, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EXAMPLE_FILES } from "../lib/exampleFiles";

interface FileSelectorProps {
  analyzeHeaders: (file: File) => void;
  isDragActive: boolean;
  getRootProps: () => any;
  getInputProps: () => any;
}

const FileSelector: React.FC<FileSelectorProps> = ({
  analyzeHeaders,
  isDragActive,
  getRootProps,
  getInputProps,
}) => {
  const [csvContent, setCsvContent] = useState("");

  const handlePasteCSV = () => {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const file = new File([blob], "Pasted CSV data", { type: "text/csv" });
    analyzeHeaders(file);
    setCsvContent(""); // Clear the text area after processing
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col md:flex-row gap-4 p-4 min-h-[300px]">
        <div
          className={`border-2 border-dotted hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all flex flex-1 flex-col items-center justify-center shrink-0 ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400 cursor-pointer"
          }`}
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500 text-center">
            {isDragActive
              ? "Drop the CSV file here"
              : "Drag and drop a CSV file here, or click to select"}
          </p>
        </div>
        <div className="flex-1 flex flex-col shrink-0">
          <Textarea
            className="w-full h-full"
            placeholder="Paste your CSV content here..."
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
          />
          <Button
            className="mt-2"
            onClick={handlePasteCSV}
            disabled={!csvContent}
          >
            Analyze data
          </Button>
        </div>
      </Card>

      <div className="mt-6 w-full flex flex-col items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Or try an example:
        </p>
        <div className="flex gap-4 justify-center">
          {EXAMPLE_FILES.map((exampleFile) => (
            <div
              key={exampleFile.path}
              className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex flex-col gap-2 text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {exampleFile.name}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(exampleFile.path);
                        const blob = await response.blob();
                        const csvFile = new File(
                          [blob],
                          exampleFile.path.split("/").pop() || "example.csv",
                          { type: "text/csv" }
                        );
                        analyzeHeaders(csvFile);
                      } catch (error) {
                        console.error("Error loading example file:", error);
                        toast.error("Failed to load example file");
                      }
                    }}
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    {exampleFile.path.split("/").pop()}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(exampleFile.path);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download =
                          exampleFile.path.split("/").pop() || "example.csv";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error("Error downloading example file:", error);
                        toast.error("Failed to download example file");
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileSelector;
