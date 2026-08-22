import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Upload, Film, Inbox } from "lucide-react";
import { api } from "../lib/api";
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["exams", page, pageSize],
    queryFn: () => fetchExams({ page, pageSize }),
    // Keep the list fresh-ish; new uploads and status changes show up.
    refetchInterval: 5000,
  });

  function setPage(next) {
    setParams({ page: String(next) });
  }

  const items = data?.items || [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Uploads
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Uploaded CCTV footage and proctoring insights.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Upload size={16} />
          New upload
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
        {isLoading ? (
          <SkeletonRows rows={6} cols={5} />
        ) : isError ? (
          <div className="p-10 text-center text-sm text-red-600">
            Couldn't load exams. Check that the backend is running, then retry.
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Exam Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Candidate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Events
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Uploaded
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((exam) => (
                  <tr key={exam.id} className="group transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/exams/${exam.id}`}
                        className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Film size={16} className="text-slate-400 dark:text-slate-500" />
                        {exam.examName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{exam.candidate || "Unknown"}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">
                        {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={exam.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {exam.summary?.totalEvents ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">
                      {formatDateTime(exam.uploadedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox size={24} />
      </span>
      <h3 className="text-base font-medium text-slate-900 font-display">
        No exams yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Upload your first exam CCTV recording to run the proctoring analysis and
        see flagged events, motion heatmaps, and evidence clips.
      </p>
      <Link
        to="/upload"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        <Upload size={16} />
        Upload footage
      </Link>
    </div>
  );
}
