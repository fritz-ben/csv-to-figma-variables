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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import confetti from "canvas-confetti";

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
    const uniqueNames = Array.from(
      new Set(data.map((row) => row[modesKey[0]]))
    ).filter(Boolean);

    const jsonFiles: { [key: string]: any } = {};
    uniqueNames.forEach((name) => {
      const modeData = data.filter((row) => row[modesKey[0]] === name);
      const processedModeData = modeData.reduce((acc: any, row: any) => {
        if (
          !Object.values(row).some((value) => value !== "" && value != null)
        ) {
          return acc;
        }

        Object.entries(row).forEach(([key, value]) => {
          if (value !== "" && value != null) {
            acc[key] = {
              $value: value,
              $type: typeof value === "number" ? "number" : "string",
            };
          }
        });
        return acc;
      }, {});

      if (Object.keys(processedModeData).length > 0) {
        jsonFiles[`${collectionName}.${name}.tokens.json`] = processedModeData;
      }
    });

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

    // Add confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary cursor-pointer"
                }`}
              >
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                    {isDragActive
                      ? "Drop the CSV file here"
                      : "Drag and drop a CSV file here, or click to select"}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="selected-file"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
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
                      >
                        Change File
                      </Button>
                    </div>

                    {csvHeaders.length > 0 && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Select Mode Column
                          </label>
                          <Select
                            value={modesKey[0] || ""}
                            onValueChange={(value) => setModesKey([value])}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a column" />
                            </SelectTrigger>
                            <SelectContent>
                              {csvHeaders.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {modesKey.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Button
                              onClick={handleProcessCSV}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Process CSV
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {processedData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                        <DialogContent className="max-w-[800px] w-[90vw] max-h-[80vh] flex flex-col top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
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
                          <DialogContent className="max-w-[800px] w-[90vw] max-h-[80vh] flex flex-col top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                            <DialogTitle>{`${modesKey[0]}.${mode}.tokens.json`}</DialogTitle>
                            <div className="flex-1 overflow-auto">
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
