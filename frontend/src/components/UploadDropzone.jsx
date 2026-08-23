import { useRef, useState } from "react";
import { UploadCloud, Film, X } from "lucide-react";
import { formatBytes } from "../lib/format";

const ACCEPT = ".mp4,.avi,.mov,.mkv,.webm,.m4v,video/*";
const ALLOWED = /\.(mp4|avi|mov|mkv|webm|m4v)$/i;

// Drag-and-drop + click-to-pick video selector. Controlled: parent owns `file`.
export default function UploadDropzone({ file, onFile, onFileSelect, disabled }) {
  const setFileCallback = onFile || onFileSelect || (() => {});
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(null);

  function pick(selected) {
    setRejected(null);
    if (!selected) return;
    if (!ALLOWED.test(selected.name) && !selected.type?.startsWith("video/")) {
      setRejected(`Unsupported file type: ${selected.name}`);
      return;
    }
    setFileCallback(selected);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    pick(e.dataTransfer.files?.[0]);
  }

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Film size={22} />
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {file.name}
            </div>
            <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {formatBytes(file.size)}
            </div>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => setFileCallback(null)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95"
            title="Remove"
          >
            <X size={18} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging
            ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-950/30 shadow-inner"
            : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/40 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400">
          <UploadCloud size={28} />
        </span>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Drop exam footage here, or <span className="text-blue-600 dark:text-blue-400 underline underline-offset-2">browse files</span>
        </p>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
          Supports MP4, AVI, MOV, MKV, WEBM, M4V
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              pick(e.target.files[0]);
            }
          }}
        />
      </div>
      {rejected && (
        <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{rejected}</p>
      )}
    </div>
  );
}
