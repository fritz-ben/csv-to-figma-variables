"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import JSZip from "jszip";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import FileCard from "@/components/FileCard";
import FileSelector from "./FileSelector";
import ProcessedFiles from "@/components/ProcessedFiles";
interface ProcessedData {
  modesKey: string[];
  modes: string[];
  jsonFiles: { [key: string]: any };
  manifest: any;
}

export default function CSVProcessor() {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]); // Ensure it's initialized as an empty array
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
    const allNames = data.map((row) => row[modesKey[0]]).filter(Boolean);
    const uniqueNames = Array.from(new Set(allNames));

    // Check for numeric mode keys
    const numericModes = uniqueNames.filter((name) => !isNaN(Number(name)));
    if (numericModes.length > 0) {
      toast.warning("Numeric mode keys detected", {
        description: `Using numbers as mode keys in Figma is not recommended. Please use semantic names instead.`,
      });
    }

    // Check for duplicates
    if (allNames.length !== uniqueNames.length) {
      const duplicates = allNames.filter(
        (name, index) => allNames.indexOf(name) !== index
      );
      const uniqueDuplicates = Array.from(new Set(duplicates));
      toast.warning("Duplicate mode keys detected", {
        description: `Only the last occurrence of each key will be processed. For example: ${uniqueDuplicates.join(
          ", "
        )}`,
      });
    }

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
    const zipName = selectedFile?.name.replace(".csv", "") || "processed-files";
    a.download = `${zipName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Files downloaded successfully!");
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div
                key="no-file-selected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FileSelector
                  analyzeHeaders={analyzeHeaders}
                  isDragActive={isDragActive}
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                />
              </motion.div>
            ) : (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FileCard
                  selectedFile={selectedFile}
                  csvHeaders={csvHeaders}
                  modesKey={modesKey}
                  setModesKey={setModesKey}
                  handleProcessCSV={handleProcessCSV}
                  resetFileSelection={() => {
                    setSelectedFile(null);
                    setCsvHeaders([]);
                    setModesKey([]);
                    setProcessedData(null);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {processedData && (
          <ProcessedFiles
            processedData={processedData}
            modesKey={modesKey}
            downloadZip={downloadZip}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
