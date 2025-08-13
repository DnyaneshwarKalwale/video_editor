import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CircleCheckIcon, XIcon, Download } from "lucide-react";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";

interface VariationDownloadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  variationName: string;
  isCompleted: boolean;
  downloadUrl?: string;
  onDownload?: () => void;
}

const VariationDownloadProgressModal: React.FC<VariationDownloadProgressModalProps> = ({
  isOpen,
  onClose,
  progress,
  variationName,
  isCompleted,
  downloadUrl,
  onDownload,
}) => {
  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[400px] flex-col gap-0 bg-background p-0 sm:max-w-[500px]">
        <DialogTitle className="hidden" />
        <DialogDescription className="hidden" />
        <XIcon
          onClick={onClose}
          className="absolute right-4 top-5 h-5 w-5 text-zinc-400 hover:cursor-pointer hover:text-zinc-500"
        />
        <div className="flex h-16 items-center border-b px-4 font-medium">
          Download Variation
        </div>
        {isCompleted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 space-y-4">
            <div className="flex flex-col items-center space-y-1 text-center">
              				<div className="font-semibold" style={{ color: 'rgb(80, 118, 178)' }}>
                <CircleCheckIcon className="w-12 h-12" />
              </div>
              <div className="font-bold text-lg">Variation Downloaded!</div>
              <div className="text-muted-foreground text-sm">
                {variationName} has been downloaded to your device.
              </div>
            </div>
            <Button onClick={handleDownload} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Again
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            				<div className="text-5xl font-semibold" style={{ color: 'rgb(80, 118, 178)' }}>
              {Math.floor(progress)}%
            </div>
            <div className="font-bold text-lg">Rendering Variation...</div>
            <div className="text-center text-zinc-500 text-sm max-w-xs">
              <div>Creating your variation video with Remotion.</div>
              <div className="mt-1">This may take a few moments.</div>
            </div>
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: 'rgb(80, 118, 178)', width: `${progress}%` }}
              />
            </div>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VariationDownloadProgressModal; 