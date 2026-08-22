import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, ShieldAlert, Flag, ArrowRight, Inbox } from "lucide-react";
import { api } from "../lib/api";
import Pagination from "../components/Pagination";
import { SkeletonCard } from "../components/Skeleton";
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
          Investigation Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Investigation reports for exams that finished processing.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-40" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 backdrop-blur-md p-10 text-center text-sm text-red-600 dark:text-red-400 shadow-sm">
          Couldn't load reports. Check that the backend is running, then retry.
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((exam) => {
              const high = exam.summary?.eventsBySeverity?.HIGH ?? 0;
              const total = exam.summary?.totalEvents ?? 0;
              return (
                <Link
                  key={exam.id}
                  to={`/exams/${exam.id}/report`}
                  className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 group"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                      <FileText size={20} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                        {exam.examName}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
                        {exam.processedAt ? (
                          <>
                            {" · "}
                            <span className="font-mono">
                              {formatDateTime(exam.processedAt)}
                            </span>
                          </>
                        ) : (
                          ""
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Flag size={15} className="text-blue-500" />
                      <span className="font-mono">{total}</span> events
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <ShieldAlert size={15} className="text-red-500" />
                      <span className="font-mono">{high}</span> high
                    </span>
                  </div>
                </Link>
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
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md px-6 py-16 text-center shadow-sm">
      <div className="mb-4 rounded-full bg-slate-50 dark:bg-slate-800 p-3">
        <FileText size={32} className="text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No reports found</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Reports appear here once an uploaded exam finishes processing. Upload a
        recording to generate your first one.
      </p>
      <Link
        to="/upload"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Upload footage
      </Link>
    </div>
  );
}
