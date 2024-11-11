"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface JsonPreviewProps {
  data: any;
}

export default function JsonPreview({ data }: JsonPreviewProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">JSON Preview</h3>
      <ScrollArea className="h-[500px] w-full rounded-md border">
        <pre className="p-4 text-sm">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}