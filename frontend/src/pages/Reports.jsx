import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, ShieldAlert, Flag, ArrowRight, Inbox } from "lucide-react";
import { api } from "../lib/api";
import Pagination from "../components/Pagination";
import { EXAM_TYPE_LABELS, DEFAULT_PAGE_SIZE } from "../lib/constants";
import { formatDateTime } from "../lib/format";

function fetchReports({ page, pageSize }) {
  return api
    .get("/exams", { params: { page, page_size: pageSize, status: "done" } })
    .then((r) => r.data);
}

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const pageSize = DEFAULT_PAGE_SIZE;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", page, pageSize],
    queryFn: () => fetchReports({ page, pageSize }),
    refetchInterval: 10000,
  });

  const items = data?.items || [];

  return (
    <div>
      <div className="anim-fade-in-down mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Investigation reports for exams that finished processing.
        </p>
      </div>

      {isLoading ? (
        <div className="anim-fade-in flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-200 border-t-blue-600" />
          <span className="text-sm text-slate-400">Loading reports…</span>
        </div>
      ) : isError ? (
        <div className="anim-shake rounded-2xl border border-slate-200 bg-white p-10 text-center text-red-600 shadow-sm">
          Failed to load reports. Is the backend running?
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((exam, idx) => {
              const high = exam.summary?.eventsBySeverity?.HIGH ?? 0;
              const total = exam.summary?.totalEvents ?? 0;
              return (
                <div
                  key={exam.id}
                  className="anim-fade-in-up hover-card btn-press group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all group-hover:bg-blue-100 group-hover:scale-110">
                      <FileText size={20} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900">
                        {exam.examName}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
                        {exam.processedAt
                          ? ` · ${formatDateTime(exam.processedAt)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Flag size={15} className="text-blue-500" />
                      {total} events
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <ShieldAlert size={15} className="text-red-500" />
                      {high} high
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <Link
                      to={`/exams/${exam.id}/report`}
                      className="btn-press inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200/50"
                    >
                      View report
                      <ArrowRight size={15} />
                    </Link>
                    <Link
                      to={`/exams/${exam.id}`}
                      className="btn-press inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
                    >
                      Dashboard
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 overflow-hidden rounded-2xl">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={data?.total || 0}
              onChange={(p) => setParams({ page: String(p) })}
            />
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <span className="anim-bounce-in mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox size={24} className="anim-float" />
      </span>
      <h3 className="anim-fade-in-up anim-delay-2 text-base font-medium text-slate-900">
        No reports yet
      </h3>
      <p className="anim-fade-in-up anim-delay-3 mt-1 max-w-sm text-sm text-slate-500">
        Reports appear here once an uploaded exam finishes processing. Upload a
        recording to generate your first one.
      </p>
      <Link
        to="/upload"
        className="anim-fade-in-up anim-delay-4 btn-press mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200/50"
      >
        Upload footage
      </Link>
    </div>
  );
}
