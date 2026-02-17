import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText, Image as ImageIcon, Video, Music, File } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  currentFile?: File | null;
}

export function FileUpload({ 
  onFileSelect, 
  accept = "image/*,application/pdf,video/*,audio/*",
  maxSizeMB = 16,
  currentFile 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (type.startsWith("video/")) return <Video className="h-8 w-8 text-purple-500" />;
    if (type.startsWith("audio/")) return <Music className="h-8 w-8 text-green-500" />;
    if (type === "application/pdf") return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      toast.error(`Arquivo muito grande! Tamanho máximo: ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      onFileSelect(null);
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    // Simular progresso de upload
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleRemove = () => {
    handleFileChange(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {!currentFile ? (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Arraste um arquivo aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground">
              Imagens, PDFs, vídeos ou áudios (máx. {maxSizeMB}MB)
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getFileIcon(currentFile.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(currentFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-1" />
                  <p className="text-xs text-muted-foreground">
                    Preparando... {uploadProgress}%
                  </p>
                </div>
              )}

              {uploadProgress === 100 && (
                <Badge variant="secondary" className="text-xs">
                  ✓ Pronto para enviar
                </Badge>
              )}
            </div>
          </div>

          {/* Preview para imagens */}
          {currentFile.type.startsWith("image/") && uploadProgress === 100 && (
            <div className="mt-3 rounded-lg overflow-hidden border">
              <img
                src={URL.createObjectURL(currentFile)}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
            </div>
          )}
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />
    </div>
  );
}
