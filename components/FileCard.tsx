import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { FileJson, WandSparkles } from "lucide-react";

interface FileCardProps {
  selectedFile: File | null;
  csvHeaders?: string[];
  modesKey: string[];
  setModesKey: (modes: string[]) => void;
  handleProcessCSV: () => void;
  resetFileSelection: () => void;
}

const FileCard: React.FC<FileCardProps> = ({
  selectedFile,
  csvHeaders = [],
  modesKey,
  setModesKey,
  handleProcessCSV,
  resetFileSelection,
}) => {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileJson className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Source</h3>
              <p className="text-sm text-muted-foreground">
                {selectedFile ? selectedFile.name : "Pasted csv data"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={resetFileSelection}>
            Change Input
          </Button>
        </div>

        {csvHeaders.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Mode
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
                <Button onClick={handleProcessCSV} className="w-full">
                  <WandSparkles className="h-4 w-4 mr-2" />
                  Process CSV
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default FileCard;
