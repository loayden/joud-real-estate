"use client";

/* eslint-disable @next/next/no-img-element */

import {
  GripVertical,
  ImagePlus,
  Star,
  Trash2,
  Upload,
  X,
  Video,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import type { PropertyImageItem } from "@/components/property/PropertyForm/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch, getCsrfToken } from "@/lib/api-client";

type UploadingFile = {
  id: string;
  name: string;
  preview: string;
  progress: number;
  error?: string;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const copy = {
  ar: {
    choose: "اسحب الصور أو الفيديو هنا أو اضغط للاختيار",
    hint: "JPEG، PNG، WebP، HEIC (حتى 10MB) أو MP4، WebM، MOV (حتى 100MB)",
    primary: "تعيين كرئيسية",
    delete: "حذف",
    uploading: "جار الرفع",
    limit: "وصلت إلى الحد الأقصى للوسائط.",
    uploadError: "تعذر رفع الملفات.",
    reorderError: "تعذر حفظ الترتيب.",
    primaryError: "تعذر تعيين الصورة الرئيسية.",
    deleteError: "تعذر الحذف.",
    count: "وسائط",
  },
  en: {
    choose: "Drag images or video here or click to choose",
    hint: "JPEG, PNG, WebP, HEIC (up to 10MB) or MP4, WebM, MOV (up to 100MB)",
    primary: "Set as primary",
    delete: "Delete",
    uploading: "Uploading",
    limit: "Maximum media count reached.",
    uploadError: "Could not upload files.",
    reorderError: "Could not save order.",
    primaryError: "Could not set primary image.",
    deleteError: "Could not delete.",
    count: "media",
  },
} as const;

function uniqueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseUploadResponse(value: string) {
  return JSON.parse(value) as ApiResponse<PropertyImageItem[]>;
}

function reorderImages(
  images: PropertyImageItem[],
  fromIndex: number,
  toIndex: number,
) {
  const next = [...images];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((image, index) => ({ ...image, sortOrder: index }));
}

export function ImageUploader({
  propertyId,
  existingImages,
  maxImages = 20,
  locale = "ar",
  onImagesChange,
}: {
  propertyId: string;
  existingImages: PropertyImageItem[];
  maxImages?: number;
  locale?: "ar" | "en";
  onImagesChange?: (images: PropertyImageItem[]) => void;
}) {
  const text = copy[locale];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState(() =>
    [...existingImages].sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isVideo = (mediaType?: string) => mediaType === "video";

  const imageCountLabel = useMemo(
    () => `${images.length} / ${maxImages} ${text.count}`,
    [images.length, maxImages, text.count],
  );

  function updateImages(nextImages: PropertyImageItem[]) {
    setImages(nextImages);
    onImagesChange?.(nextImages);
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const remainingSlots = maxImages - images.length;
    const acceptedFiles = files.slice(0, Math.max(remainingSlots, 0));

    if (acceptedFiles.length === 0) {
      setError(text.limit);
      return;
    }

    if (acceptedFiles.length < files.length) {
      setError(text.limit);
    } else {
      setError(null);
    }

    const previews = acceptedFiles.map((file) => ({
      id: uniqueId(),
      name: file.name,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    setUploading((current) => [...current, ...previews]);

    const formData = new FormData();
    formData.append("propertyId", propertyId);
    acceptedFiles.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/property-images");
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      xhr.setRequestHeader("x-csrf-token", csrfToken);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      setUploading((current) =>
        current.map((file) =>
          previews.some((preview) => preview.id === file.id)
            ? { ...file, progress }
            : file,
        ),
      );
    };

    xhr.onload = () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.preview));
      setUploading((current) =>
        current.filter(
          (file) => !previews.some((preview) => preview.id === file.id),
        ),
      );

      try {
        const payload = parseUploadResponse(xhr.responseText);
        if (xhr.status < 200 || xhr.status >= 300 || !payload.success) {
          throw new Error(payload.success ? text.uploadError : payload.error);
        }

        setImages((current) => {
          const next = [...current, ...payload.data].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          );
          onImagesChange?.(next);
          return next;
        });
      } catch (uploadError) {
        setError(
          uploadError instanceof Error ? uploadError.message : text.uploadError,
        );
      }
    };

    xhr.onerror = () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.preview));
      setUploading((current) =>
        current.filter(
          (file) => !previews.some((preview) => preview.id === file.id),
        ),
      );
      setError(text.uploadError);
    };

    xhr.send(formData);
  }

  async function saveReorder(nextImages: PropertyImageItem[]) {
    try {
      const response = await apiFetch("/api/upload/property-images/reorder", {
        body: JSON.stringify({
          images: nextImages.map((image, index) => ({
            id: image.id,
            sortOrder: index,
          })),
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error(text.reorderError);
      }
    } catch (reorderError) {
      setError(
        reorderError instanceof Error
          ? reorderError.message
          : text.reorderError,
      );
    }
  }

  async function setPrimary(imageId: string) {
    const previous = images;
    const next = images.map((image) => ({
      ...image,
      isPrimary: image.id === imageId,
    }));
    updateImages(next);

    try {
      const response = await fetch(
        `/api/upload/property-images/${imageId}/primary`,
        { method: "PUT" },
      );

      if (!response.ok) {
        throw new Error(text.primaryError);
      }
    } catch (primaryError) {
      updateImages(previous);
      setError(
        primaryError instanceof Error
          ? primaryError.message
          : text.primaryError,
      );
    }
  }

  async function deleteImage(imageId: string) {
    const previous = images;
    updateImages(images.filter((image) => image.id !== imageId));

    try {
      const response = await apiFetch(
        `/api/upload/property-images/${imageId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(text.deleteError);
      }
    } catch (deleteError) {
      updateImages(previous);
      setError(
        deleteError instanceof Error ? deleteError.message : text.deleteError,
      );
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);

    if (event.dataTransfer.files.length > 0) {
      uploadFiles(event.dataTransfer.files);
    }
  }

  function handleCardDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }

    const next = reorderImages(images, dragIndex, targetIndex);
    updateImages(next);
    setDragIndex(null);
    void saveReorder(next);
  }

  return (
    <div className="grid gap-4">
      <div
        className={cn(
          "grid min-h-40 cursor-pointer place-items-center rounded-md border border-dashed border-border bg-muted/30 p-6 text-center transition-colors",
          dragOver && "border-primary bg-primary-50",
        )}
        onClick={() => inputRef.current?.click()}
        onDragLeave={() => setDragOver(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDrop={handleDrop}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <input
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="sr-only"
          multiple
          onChange={(event) => {
            if (event.target.files) {
              uploadFiles(event.target.files);
              event.target.value = "";
            }
          }}
          ref={inputRef}
          type="file"
        />
        <div className="grid justify-items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
            <ImagePlus className="size-5" />
          </div>
          <div>
            <div className="font-bold">{text.choose}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {text.hint}
            </div>
          </div>
          <div className="rounded-full bg-background px-3 py-1 text-xs font-bold text-muted-foreground">
            {imageCountLabel}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
          {error}
        </div>
      ) : null}

      {uploading.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {uploading.map((file) => (
            <div
              className="overflow-hidden rounded-md border border-border bg-background"
              key={file.id}
            >
              {file.name.match(/\.(mp4|webm|mov)$/i) ? (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
                  <Video className="size-12 text-muted-foreground" />
                </div>
              ) : (
                <img
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                  src={file.preview}
                />
              )}
              <div className="grid gap-2 p-3">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Upload className="size-4 text-primary" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {text.uploading} {file.progress}%
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image, index) => {
            const video = isVideo(image.mediaType);
            return (
              <div
                className="group overflow-hidden rounded-md border border-border bg-background"
                draggable
                key={image.id}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDragIndex(index)}
                onDrop={() => handleCardDrop(index)}
              >
                <div className="relative">
                  {video ? (
                    <video
                      className="aspect-[4/3] w-full object-cover"
                      muted
                      preload="metadata"
                      src={image.url}
                    />
                  ) : (
                    <img
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                      src={image.thumbnailUrl ?? image.url}
                    />
                  )}
                  <div className="absolute inset-x-2 top-2 flex items-center justify-between">
                    <button
                      aria-label={text.primary}
                      className={cn(
                        "grid size-9 place-items-center rounded-full border border-white/70 bg-background/90 shadow-sm",
                        image.isPrimary && "bg-gold text-gold-foreground",
                      )}
                      onClick={() => setPrimary(image.id)}
                      type="button"
                    >
                      <Star className="size-4" />
                    </button>
                    <button
                      aria-label={text.delete}
                      className="grid size-9 place-items-center rounded-full border border-white/70 bg-background/90 text-destructive shadow-sm"
                      onClick={() => deleteImage(image.id)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  {video && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Video className="size-12 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 text-xs font-bold text-muted-foreground">
                  <span>{index + 1}</span>
                  <span className="inline-flex items-center gap-1">
                    <GripVertical className="size-4" />
                    {image.isPrimary
                      ? text.primary
                      : video
                        ? "Video"
                        : text.choose}
                  </span>
                  <Button
                    aria-label={text.delete}
                    onClick={() => deleteImage(image.id)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
