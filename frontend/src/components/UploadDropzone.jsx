import { useRef, useState } from "react";
import { UploadCloud, Film, X } from "lucide-react";
import { formatBytes } from "../lib/format";

const ACCEPT = ".mp4,.avi,.mov,.mkv,.webm,.m4v";
const ALLOWED = /\.(mp4|avi|mov|mkv|webm|m4v)$/i;

// Drag-and-drop + click-to-pick video selector. Controlled: parent owns `file`.
export default function UploadDropzone({ file, onFile, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(null);

  function pick(selected) {
    setRejected(null);
    if (!selected) return;
    if (!ALLOWED.test(selected.name)) {
      setRejected(`Unsupported file type: ${selected.name}`);
      return;
    }
    onFile(selected);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    pick(e.dataTransfer.files?.[0]);
  }

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Film size={20} />
          </span>
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
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
            onClick={() => onFile(null)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200"
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
        className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging
            ? "border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
            : "border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-slate-400 dark:hover:border-slate-500"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          <UploadCloud size={24} />
        </span>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Drop exam footage here, or click to browse
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          MP4, AVI, MOV, MKV, WEBM, or M4V
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {rejected && (
        <p className="mt-2 text-sm text-red-600">{rejected}</p>
      )}
    </div>
  );
}
