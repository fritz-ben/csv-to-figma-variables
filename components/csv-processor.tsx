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
import { Input } from "@/components/ui/input";

interface ProcessedData {
  modesKey: string[];
  modes: string[];
  jsonFiles: { [key: string]: any };
  manifest: any;
}

export default function CSVProcessor() {
  const [modesKey, setModesKey] = useState<string[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );
  const [collectionName, setCollectionName] = useState("New Collection");

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          processCSV(results.data);
        },
        header: true,
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
    disabled: !collectionName || modesKey.length === 0,
  });

  const processCSV = (data: any[]) => {
    // Get unique names (modes) using the first modesKey
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
          <div>
            <label
              htmlFor="collectionName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Collection name
            </label>
            <Input
              id="collectionName"
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="modesKey"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Which column contains the modes?
            </label>
            <Input
              id="modesKey"
              type="text"
              placeholder="e.g. Language or Theme"
              value={modesKey.join(", ")}
              onChange={handleModesKeyChange}
              className="w-full"
            />
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : !collectionName || modesKey.length === 0
                ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-50"
                : "border-gray-300 hover:border-primary cursor-pointer"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              {!collectionName || modesKey.length === 0
                ? "Please fill in Collection name and Modes Keys first"
                : isDragActive
                ? "Drop the CSV file here"
                : "Drag and drop a CSV file here, or click to select"}
            </p>
          </div>
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
                            <DialogTitle className="sr-only">
                              CSV Processing Results
                            </DialogTitle>
                            <div className="grid gap-4">
                              <JsonPreview
                                data={
                                  processedData.jsonFiles[
                                    `${collectionName}.${mode}.tokens.json`
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

            <div className="flex justify-center gap-4">
              <Button onClick={downloadZip} className="w-full max-w-xs">
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
