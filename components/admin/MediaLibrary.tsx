"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";
import { Image as ImageIcon, Trash, Upload } from "@/components/ui/Icons";
import { deleteMedia, fetchMedia, uploadMedia, type MediaLimits } from "@/services/media";
import { isAbort } from "@/services/api-client";
import type { MediaItem } from "@/lib/media-types";

/**
 * Media library.
 *
 * Doubles as the featured-image picker: pass `onSelect` and each tile becomes a
 * choose button, which is how the post editor reuses this screen's grid without
 * a second implementation.
 */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({
  onSelect,
  selectedUrl,
  compact = false,
}: {
  /** When provided, tiles become selectable for a featured image. */
  onSelect?: (item: MediaItem) => void;
  selectedUrl?: string;
  /** Tighter grid and no page heading, for use inside the post editor. */
  compact?: boolean;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [totalSize, setTotalSize] = useState("0 B");
  const [limits, setLimits] = useState<MediaLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchMedia>>) => {
    if (isAbort(result)) return;

    if (result.ok) {
      setItems(result.data.items);
      setTotalSize(result.data.totalSize);
      setLimits(result.data.limits);
      setLoadError(null);
    } else {
      setLoadError(result.error.message);
    }
    setIsLoading(false);
  }, []);

  const load = useCallback(async () => {
    apply(await fetchMedia());
  }, [apply]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMedia(controller.signal).then(apply);
    return () => controller.abort();
  }, [apply]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setNotice(null);

    let uploaded = 0;
    const failures: string[] = [];

    // Sequential rather than parallel: keeps error attribution clear and avoids
    // hammering the server with several multi-megabyte bodies at once.
    for (const file of Array.from(files)) {
      const result = await uploadMedia(file);
      if (result.ok) uploaded += 1;
      else failures.push(`${file.name}: ${result.error.message}`);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (uploaded > 0) {
      setNotice(`Uploaded ${uploaded} image${uploaded === 1 ? "" : "s"}.`);
      void load();
    }
    if (failures.length > 0) setUploadError(failures.join(" · "));
  }

  async function remove(item: MediaItem, force: boolean) {
    setBusyId(item.id);
    setUploadError(null);
    setNotice(null);

    const result = await deleteMedia(item.id, force);
    setBusyId(null);

    if (!result.ok) {
      setUploadError(result.error.message);
      return;
    }

    const cleared = result.data.clearedFromPosts;
    setNotice(
      `Deleted ${item.originalName}${
        cleared > 0
          ? ` and removed it from ${cleared} post${cleared === 1 ? "" : "s"}`
          : ""
      }.`,
    );
    setConfirmDeleteId(null);
    void load();
  }

  const accept = limits?.acceptedTypes.join(",") ?? "image/*";

  return (
    <div>
      {!compact && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-ink">Media</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Images available as blog featured images. Files are stored on the server under{" "}
              <code className="font-mono text-[0.9em]">public/uploads</code>.
            </p>
          </div>
        </div>
      )}

      {/* Upload */}
      <div className={cn("rounded-[6px] border border-dashed border-line bg-beige-light/40 p-6 text-center", compact ? "mt-0" : "mt-7")}>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-burgundy-tint text-burgundy">
          <Upload className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-medium text-ink">Upload an image</p>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted">
          {limits
            ? `Up to ${limits.maxSize} each. Accepted: ${limits.acceptedTypes
                .map((type) => type.replace("image/", "."))
                .join(", ")}.`
            : "Checking upload limits…"}
        </p>

        <label className="mt-5 inline-block">
          <span className="sr-only">Choose images to upload</span>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            disabled={uploading}
            onChange={(event) => void handleFiles(event.target.files)}
            className="block w-full cursor-pointer text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-[3px] file:border-0 file:bg-burgundy file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-cream hover:file:bg-burgundy-warm disabled:cursor-not-allowed"
          />
        </label>

        {uploading && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
            <Spinner className="text-burgundy" />
            Uploading…
          </p>
        )}
      </div>

      {notice && (
        <Alert tone="success" className="mt-6">
          {notice}
        </Alert>
      )}
      {uploadError && (
        <Alert tone="error" className="mt-6" title="Upload problem">
          {uploadError}
        </Alert>
      )}

      {/* Grid */}
      {isLoading ? (
        <LoadingBlock label="Loading the media library…" />
      ) : loadError ? (
        <Alert
          tone="error"
          className="mt-6"
          title="We couldn't load the media library"
          action={
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                void load();
              }}
              className="text-sm font-medium underline underline-offset-4"
            >
              Retry
            </button>
          }
        >
          {loadError}
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<ImageIcon className="h-5 w-5" />}
          title="No images yet"
          description="Upload an image above and it will appear here, ready to use as a blog featured image."
        />
      ) : (
        <>
          {!compact && (
            <p className="mt-6 text-sm text-muted">
              {items.length} image{items.length === 1 ? "" : "s"} &middot; {totalSize} total
            </p>
          )}

          <ul
            className={cn(
              "mt-4 grid gap-4",
              compact
                ? "grid-cols-2 sm:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
            )}
          >
            {items.map((item) => {
              const busy = busyId === item.id;
              const isConfirming = confirmDeleteId === item.id;
              const isSelected = selectedUrl === item.url;

              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-[6px] border bg-cream transition-[border-color,box-shadow]",
                    isSelected
                      ? "border-burgundy shadow-soft"
                      : "border-line hover:border-burgundy/40",
                  )}
                >
                  <div className="relative aspect-[4/3] bg-beige-light">
                    {/* `unoptimized` because these are already-sized uploads
                        served from /public; the optimizer adds nothing here. */}
                    <Image
                      src={item.url}
                      alt={item.alt || item.originalName}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                    {isSelected && (
                      <span className="absolute left-2 top-2 rounded-full bg-burgundy px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-cream">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    <p className="truncate text-xs font-medium text-ink" title={item.originalName}>
                      {item.originalName}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-muted">
                      {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
                      {formatSize(item.size)}
                    </p>
                    {item.usedByPosts > 0 && (
                      <p className="mt-1 text-[0.7rem] text-burgundy">
                        Used by {item.usedByPosts} post{item.usedByPosts === 1 ? "" : "s"}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-3 border-t border-line pt-2.5">
                      {onSelect && (
                        <button
                          type="button"
                          onClick={() => onSelect(item)}
                          className="text-xs font-medium text-burgundy underline-offset-4 hover:underline"
                        >
                          {isSelected ? "Selected" : "Use this"}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmDeleteId(item.id)}
                        aria-label={`Delete ${item.originalName}`}
                        className="ml-auto text-muted transition-colors hover:text-danger disabled:opacity-60"
                      >
                        {busy ? <Spinner className="h-3.5 w-3.5" /> : <Trash className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {isConfirming && (
                      <div className="mt-3 rounded-[4px] border border-danger/30 bg-danger/[0.04] p-2.5">
                        <p className="text-[0.7rem] leading-relaxed text-danger">
                          {item.usedByPosts > 0
                            ? `Used by ${item.usedByPosts} post${
                                item.usedByPosts === 1 ? "" : "s"
                              }. Deleting will remove it from ${
                                item.usedByPosts === 1 ? "that post" : "those posts"
                              }.`
                            : "Delete this image permanently?"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void remove(item, item.usedByPosts > 0)}
                            className="rounded-[3px] bg-danger px-2.5 py-1 text-[0.7rem] font-medium text-cream hover:opacity-90 disabled:opacity-60"
                          >
                            {busy ? "Deleting…" : "Delete"}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[0.7rem] font-medium text-muted underline underline-offset-4 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {!compact && (
        <Alert tone="info" className="mt-10" title="A note on hosting">
          Uploads are written to the server&rsquo;s filesystem. That works on any Node host,
          including this one. On a serverless platform (Vercel, Netlify Functions) the
          filesystem resets on each deploy, so images would disappear — move storage to
          Cloudinary or S3 there. The required environment variables are documented in{" "}
          <code className="font-mono text-[0.9em]">.env.example</code> and{" "}
          <code className="font-mono text-[0.9em]">lib/media.ts</code>.
        </Alert>
      )}
    </div>
  );
}
