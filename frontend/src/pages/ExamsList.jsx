import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Film, Inbox, Trash2, AlertCircle } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { StatusBadge } from "../components/Badge";
import Pagination from "../components/Pagination";
import { SkeletonRows } from "../components/Skeleton";
import { EXAM_TYPE_LABELS, DEFAULT_PAGE_SIZE } from "../lib/constants";
import { formatDateTime } from "../lib/format";

function fetchExams({ page, pageSize }) {
  return api
    .get("/exams", { params: { page, page_size: pageSize } })
    .then((r) => r.data);
}

export default function ExamsList() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const pageSize = DEFAULT_PAGE_SIZE;
  const queryClient = useQueryClient();

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["exams", page, pageSize],
    queryFn: () => fetchExams({ page, pageSize }),
    refetchInterval: 5000,
  });

  function setPage(next) {
    setParams({ page: String(next) });
  }

  async function handleDelete(e, exam) {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete "${exam.examName}" and all its analysis files?`)) {
      return;
    }

    setDeletingId(exam.id);
    setDeleteError(null);

    try {
      await api.delete(`/exams/${exam.id}`);
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    } catch (err) {
      setDeleteError(apiErrorMessage(err, "Failed to delete exam."));
    } finally {
      setDeletingId(null);
    }
  }

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Uploads Library
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Uploaded CCTV footage, proctoring sessions, and anomaly reports.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 active:scale-95"
        >
          <Upload size={16} />
          New upload
        </Link>
      </div>

      {deleteError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
        {isLoading ? (
          <SkeletonRows rows={6} cols={6} />
        ) : isError ? (
          <div className="p-10 text-center text-sm text-red-600">
            Couldn't load exams. Check that the backend is running, then retry.
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Exam Title</th>
                    <th className="px-6 py-4 font-semibold">Format</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Flagged Events</th>
                    <th className="px-6 py-4 font-semibold">Uploaded</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {items.map((exam) => (
                    <tr key={exam.id} className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <Link
                          to={`/exams/${exam.id}`}
                          className="flex items-center gap-2.5 font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Film size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500" />
                          <span>{exam.examName}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block rounded-md border border-slate-200/80 bg-slate-100/60 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={exam.status} />
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {exam.summary?.totalEvents ?? "—"}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(exam.uploadedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, exam)}
                          disabled={deletingId === exam.id}
                          title="Delete exam recording"
                          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:opacity-40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <Trash2 size={16} className={deletingId === exam.id ? "animate-spin" : ""} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={data?.total || 0}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Inbox size={24} />
      </span>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display">
        No exam recordings yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Upload your first examination CCTV footage to start automated proctoring analysis.
      </p>
      <Link
        to="/upload"
        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 active:scale-95"
      >
        <Upload size={16} />
        Upload footage
      </Link>
    </div>
  );
}
