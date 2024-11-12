import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import JsonPreview from "@/components/json-preview";
import { Download, Eye } from "lucide-react";

interface ProcessedFilesProps {
  processedData: {
    manifest: any;
    modes: string[];
    jsonFiles: { [key: string]: any };
  };
  modesKey: string[];
  downloadZip: () => void;
}

const ProcessedFiles: React.FC<ProcessedFilesProps> = ({
  processedData,
  modesKey,
  downloadZip,
}) => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Processed Files</h2>
      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-2">
          {/* Manifest preview */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="font-medium">manifest.json</span>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[800px] w-[90vw] max-h-[80vh] flex flex-col top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                  <DialogTitle className="mb-2 pt-2">manifest.json</DialogTitle>
                  <div className="flex-1 overflow-auto">
                    <JsonPreview data={processedData.manifest} />
                  </div>
                  <DialogClose asChild>
                    <Button variant="ghost" size="sm" className="self-end mt-2">
                      Close
                    </Button>
                  </DialogClose>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob(
                    [JSON.stringify(processedData.manifest, null, 2)],
                    { type: "application/json" }
                  );
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "manifest.json";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mode previews */}
          {processedData.modes.map((mode, index) => (
            <div
              key={`mode-${mode}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span className="font-medium">{mode}</span>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[800px] w-[90vw] max-h-[80vh] flex flex-col top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                    <DialogTitle className="mb-2 pt-2">{`${modesKey[0]}.${mode}.tokens.json`}</DialogTitle>
                    <div className="flex-1 overflow-auto">
                      <JsonPreview
                        data={
                          processedData.jsonFiles[
                            `${modesKey[0]}.${mode}.tokens.json`
                          ]
                        }
                      />
                    </div>
                    <DialogClose asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="self-end mt-2"
                      >
                        Close
                      </Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fileName = `${modesKey[0]}.${mode}.tokens.json`;
                    const content = processedData.jsonFiles[fileName];
                    const blob = new Blob([JSON.stringify(content, null, 2)], {
                      type: "application/json",
                    });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <Button onClick={downloadZip} className="w-full mt-4">
        <Download className="h-4 w-4 mr-2" />
        Download all files (zip)
      </Button>
    </Card>
  );
};

export default ProcessedFiles;
