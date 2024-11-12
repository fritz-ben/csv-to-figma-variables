"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import JSZip from "jszip";
import { Upload, FileJson, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import JsonPreview from "@/components/json-preview";
import { toast } from "sonner";

interface ProcessedData {
  modesKey: string[];
  modes: string[];
  jsonFiles: { [key: string]: any };
  manifest: any;
}

export default function CSVProcessor() {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modesKey, setModesKey] = useState<string[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );

  // Step 1: Analyze headers
  const analyzeHeaders = (file: File) => {
    Papa.parse(file, {
      preview: 1, // Read only first line
      complete: (results) => {
        if (
          results.data &&
          Array.isArray(results.data) &&
          results.data.length > 0
        ) {
          // Type assertion since we know the first row is an object
          const firstRow = results.data[0] as Record<string, unknown>;
          const headers = Object.keys(firstRow);
          setCsvHeaders(headers);
          setSelectedFile(file);
        }
      },
      header: true,
    });
  };

  // Modified onDrop to only analyze headers
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      analyzeHeaders(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
    disabled: false, // No longer needs to be disabled initially
  });

  // Step 2: Process full CSV when user clicks process button
  const handleProcessCSV = () => {
    if (selectedFile && modesKey.length > 0) {
      Papa.parse(selectedFile, {
        complete: (results) => {
          processCSV(results.data);
        },
        header: true,
      });
    }
  };

  const processCSV = (data: any[]) => {
    const collectionName = modesKey[0];

    // Get unique names (modes) using the modesKey
    const uniqueNames = Array.from(
      new Set(data.map((row) => row[modesKey[0]]))
    );

    // Generate JSON files for each mode
    const jsonFiles: { [key: string]: any } = {};
    uniqueNames.forEach((name) => {
      const modeData = data.filter((row) => row[modesKey[0]] === name);
      const processedModeData = modeData.reduce((acc: any, row: any) => {
        Object.entries(row).forEach(([key, value]) => {
          acc[key] = {
            $value: value,
            $type: typeof value === "number" ? "number" : "string",
          };
        });
        return acc;
      }, {});

      jsonFiles[`${collectionName}.${name}.tokens.json`] = processedModeData;
    });

    // Generate manifest
    const manifest = {
      name: collectionName,
      collections: {
        [collectionName]: {
          modes: uniqueNames.reduce((acc: any, name: string) => {
            acc[name] = [`${collectionName}.${name}.tokens.json`];
            return acc;
          }, {}),
        },
      },
    };

    setProcessedData({
      modesKey,
      modes: uniqueNames,
      jsonFiles,
      manifest,
    });

    toast.success("CSV processed successfully!");
  };

  const downloadZip = async () => {
    if (!processedData) return;

    const zip = new JSZip();

    // Add manifest
    zip.file("manifest.json", JSON.stringify(processedData.manifest, null, 2));

    // Add JSON files
    Object.entries(processedData.jsonFiles).forEach(([filename, content]) => {
      zip.file(filename, JSON.stringify(content, null, 2));
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "processed-files.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Files downloaded successfully!");
  };

  const handleModesKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keys = e.target.value.split(",").map((key) => key.trim());
    setModesKey(keys);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-4">
          {/* Only show drop zone if no file is selected */}
          {!selectedFile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary cursor-pointer"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                {isDragActive
                  ? "Drop the CSV file here"
                  : "Drag and drop a CSV file here, or click to select"}
              </p>
            </div>
          )}

          {/* Show file selection status when file is selected */}
          {selectedFile && (
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileJson className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Selected File</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setCsvHeaders([]);
                      setModesKey([]);
                      setProcessedData(null);
                    }}
                    className="hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Change File
                  </Button>
                </div>

                {csvHeaders.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Collection Column
                      </label>
                      <select
                        value={modesKey[0] || ""}
                        onChange={(e) => setModesKey([e.target.value])}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background 
                          placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select a column</option>
                        {csvHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>

                    {modesKey.length > 0 && (
                      <Button onClick={handleProcessCSV} className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Process CSV
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {processedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Processed Files</h2>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-4">
                  {/* Add manifest preview at the top */}
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
                        <DialogContent>
                          <DialogTitle>manifest.json</DialogTitle>
                          <div className="grid gap-4">
                            <JsonPreview data={processedData.manifest} />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Existing mode previews */}
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
                          <DialogContent>
                            <DialogTitle>{`${modesKey[0]}.${mode}.tokens.json`}</DialogTitle>
                            <div className="grid gap-4">
                              <JsonPreview
                                data={
                                  processedData.jsonFiles[
                                    `${modesKey[0]}.${mode}.tokens.json`
                                  ]
                                }
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            <div className="flex justify-center">
              <Button onClick={downloadZip} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download All Files (ZIP)
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
