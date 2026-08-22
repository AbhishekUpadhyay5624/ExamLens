import { useRef, useState } from "react";
import { UploadCloud, Film, X } from "lucide-react";
import { formatBytes } from "../lib/format";

const ACCEPT = ".mp4,.avi,.mov,.mkv,.webm,.m4v";
const ALLOWED = /\.(mp4|avi|mov|mkv|webm|m4v)$/i;

// Drag-and-drop + click-to-pick video selector with animated states.
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
      <div className="anim-bounce-in flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-200 hover:shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 anim-scale-in">
            <Film size={20} />
          </span>
          <div>
            <div className="text-sm font-medium text-slate-900">
              {file.name}
            </div>
            <div className="text-xs text-slate-500">{formatBytes(file.size)}</div>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onFile(null)}
            className="btn-press rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
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
        className={`btn-press flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${
          dragging
            ? "border-blue-400 bg-blue-50 scale-[1.02] dropzone-active shadow-lg shadow-blue-100/50"
            : "border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
          dragging
            ? "bg-blue-200 text-blue-600 scale-110"
            : "bg-slate-100 text-slate-500"
        }`}>
          <UploadCloud size={24} className={dragging ? "anim-float" : ""} />
        </span>
        <p className="text-sm font-medium text-slate-800">
          {dragging ? "Release to upload" : "Drop exam footage here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
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
        <p className="anim-shake mt-2 text-sm text-red-600">{rejected}</p>
      )}
    </div>
  );
}
