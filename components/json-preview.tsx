"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface JsonPreviewProps {
  data: any;
}

export default function JsonPreview({ data }: JsonPreviewProps) {
  return (
    <div>
      <ScrollArea className="h-[600px] w-full rounded-md border">
        <pre className="p-4 text-sm">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}
