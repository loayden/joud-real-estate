"use client";

import { Camera, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUploader({
  currentUrl,
  fallbackText,
  helpText,
  onUpload,
  uploadLabel,
}: {
  currentUrl?: string | null;
  fallbackText: string;
  helpText: string;
  onUpload: (url: string) => void;
  uploadLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayUrl = previewUrl ?? currentUrl ?? null;

  async function upload(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Unsupported image type. Use JPEG, PNG, or WebP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar image must be 2MB or smaller.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiFetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ApiResponse<{ url: string }>;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Upload failed" : payload.error);
      }

      onUpload(payload.data.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Avatar upload failed.",
      );
    } finally {
      setIsUploading(false);
      setPreviewUrl(null);
      URL.revokeObjectURL(localPreview);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          aria-label="Upload avatar"
          className={cn(
            "relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-lg font-bold text-muted-foreground transition-colors",
            dragOver ? "border-primary bg-primary-50 text-primary" : null,
          )}
          onClick={() => inputRef.current?.click()}
          onDragLeave={() => setDragOver(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const [file] = Array.from(event.dataTransfer.files);
            if (file) void upload(file);
          }}
          type="button"
        >
          {displayUrl ? (
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="96px"
              src={displayUrl}
              unoptimized={displayUrl.startsWith("blob:")}
            />
          ) : (
            fallbackText
          )}
          <span className="bg-primary/82 absolute bottom-0 flex h-8 w-full items-center justify-center text-primary-foreground">
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
          </span>
        </button>

        <div className="flex flex-col gap-2">
          <Button
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            type="button"
            variant="secondary"
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploadLabel}
          </Button>
          <p className="text-sm leading-6 text-muted-foreground">{helpText}</p>
        </div>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <input
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => {
          const [file] = Array.from(event.target.files ?? []);
          if (file) void upload(file);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
