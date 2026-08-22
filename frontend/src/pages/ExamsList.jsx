import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Upload, Film, Inbox } from "lucide-react";
import { api } from "../lib/api";
import { StatusBadge } from "../components/Badge";
import Pagination from "../components/Pagination";
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
      <div className="anim-fade-in-down mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Uploads</h1>
          <p className="mt-1 text-sm text-slate-500">
            Uploaded CCTV footage and proctoring insights.
          </p>
        </div>
        <Link
          to="/upload"
          className="btn-press inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200/50"
        >
          <Upload size={16} />
          New upload
        </Link>
      </div>

      <div className="anim-slide-up anim-delay-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 p-10">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-200 border-t-blue-600" />
            <span className="text-sm text-slate-400">Loading exams…</span>
          </div>
        ) : isError ? (
          <div className="anim-shake p-10 text-center text-red-600">
            Failed to load exams. Is the backend running?
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Exam</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Events</th>
                    <th className="px-4 py-3 font-medium">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((exam, idx) => (
                    <tr
                      key={exam.id}
                      className="anim-fade-in-left hover:bg-slate-50/80 transition-colors duration-200"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/exams/${exam.id}`}
                          className="flex items-center gap-2 font-medium text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          <Film size={16} className="text-slate-400" />
                          {exam.examName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={exam.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {exam.summary?.totalEvents ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDateTime(exam.uploadedAt)}
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
      <span className="anim-bounce-in mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox size={24} className="anim-float" />
      </span>
      <h3 className="anim-fade-in-up anim-delay-2 text-base font-medium text-slate-900">
        No exams yet
      </h3>
      <p className="anim-fade-in-up anim-delay-3 mt-1 max-w-sm text-sm text-slate-500">
        Upload your first exam CCTV recording to run the proctoring analysis and
        see flagged events, motion heatmaps, and evidence clips.
      </p>
      <Link
        to="/upload"
        className="anim-fade-in-up anim-delay-4 btn-press mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200/50"
      >
        <Upload size={16} />
        Upload footage
      </Link>
    </div>
  );
}
