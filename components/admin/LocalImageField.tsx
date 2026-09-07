"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";
import { Image as ImageIcon, Trash, Upload } from "@/components/ui/Icons";
import { uploadImage } from "@/services/uploads";
import { resolveImageUrl } from "@/lib/image-url";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_ACCEPT,
  UPLOAD_MIME_EXTENSIONS,
  formatBytes,
  isAllowedUploadType,
  type UploadFolder,
} from "@/lib/upload-types";

/**
 * Pick an image, upload it, keep the URL.
 *
 * The upload happens the moment a file is chosen rather than when the
 * surrounding form is submitted, so `value` is always a real, servable URL —
 * there is no half-saved state where a form holds bytes the server has never
 * seen. `onChange` therefore only ever emits `/api/uploads/...` strings or `""`.
 *
 * Removing or replacing an image only clears the field. The blob itself is
 * deleted server-side when the owning document is saved, because until then the
 * previous image is still the one the live site is showing.
 */

export function LocalImageField({
  value,
  onChange,
  folder,
  label = "Image",
  description,
  disabled = false,
  className,
}: {
  /** Current public URL, or an empty string. */
  value: string;
  /** Receives the new public URL, or `""` when the image is removed. */
  onChange: (url: string) => void;
  folder: UploadFolder;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const preview = resolveImageUrl(value);
  const acceptedExtensions = Object.values(UPLOAD_MIME_EXTENSIONS)
    .map((extension) => `.${extension}`)
    .join(", ");

  function openPicker() {
    setStatus(null);
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    // Validated here as well as on the server so the common mistakes get an
    // instant answer rather than a round trip.
    if (!isAllowedUploadType(file.type)) {
      setStatus({ tone: "error", message: `Choose a ${acceptedExtensions} image.` });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus({
        tone: "error",
        message: `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      });
      return;
    }

    setUploading(true);
    setStatus(null);

    const result = await uploadImage(file, folder);

    setUploading(false);

    if (!result.ok) {
      setStatus({ tone: "error", message: result.error.message });
      return;
    }

    onChange(result.data.url);
    setStatus({
      tone: "success",
      message: `Uploaded — ${formatBytes(result.data.size)}. Save to apply it.`,
    });
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
        <span className="text-xs text-muted">
          {acceptedExtensions} · max {formatBytes(MAX_UPLOAD_BYTES)}
        </span>
      </div>

      {description && <p className="text-xs leading-relaxed text-muted">{description}</p>}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={UPLOAD_ACCEPT}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Clear the input so re-picking the same file still fires a change.
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      <div className="flex flex-wrap items-start gap-4 rounded-[6px] border border-line bg-cream p-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-[4px] border border-line bg-beige-light">
          {preview ? (
            <Image
              src={preview}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
              // The preview changes as soon as an upload finishes; there is no
              // benefit to running an admin thumbnail through the optimizer.
              unoptimized
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted/60">
              <ImageIcon className="h-6 w-6" />
            </span>
          )}

          {uploading && (
            <span className="absolute inset-0 grid place-items-center bg-cream/80">
              <Spinner className="h-5 w-5 text-burgundy" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled || uploading}
              className="inline-flex items-center gap-2 rounded-[3px] border border-line bg-beige-light px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-burgundy/40 hover:text-burgundy disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : value ? "Replace" : "Upload image"}
            </button>

            {value && !uploading && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setStatus(null);
                }}
                disabled={disabled}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted underline-offset-4 hover:text-danger hover:underline disabled:opacity-60"
              >
                <Trash className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>

          {value && (
            <p className="mt-3 truncate font-mono text-xs text-muted" title={value}>
              {value}
            </p>
          )}

          {status && (
            <p
              role="status"
              className={cn(
                "mt-2 text-xs leading-relaxed",
                status.tone === "error" ? "text-danger" : "text-burgundy",
              )}
            >
              {status.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
