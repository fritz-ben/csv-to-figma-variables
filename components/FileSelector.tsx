import { Upload, FileJson, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  return (
    <div className="text-center">
      <div
        className={`border-2 border-dotted hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-12 transition-all ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400 cursor-pointer"
        }`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-4 text-md text-gray-600 dark:text-gray-300">
          {isDragActive
            ? "Drop the CSV file here"
            : "Drag and drop a CSV file here, or click to select"}
        </p>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Or try an example:
        </p>
        <div className="flex gap-4 justify-center">
          {EXAMPLE_FILES.map((exampleFile) => (
            <div
              key={exampleFile.path}
              className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex flex-col gap-2">
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
