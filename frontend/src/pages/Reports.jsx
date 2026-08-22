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
        <h1 className="text-2xl font-semibold text-slate-900 font-display">
          Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-red-600 shadow-sm">
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
                <div
                  key={exam.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText size={20} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900">
                        {exam.examName}
                      </h3>
                      <p className="text-sm text-slate-500">
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
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Flag size={15} className="text-blue-500" />
                      <span className="font-mono">{total}</span> events
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <ShieldAlert size={15} className="text-red-500" />
                      <span className="font-mono">{high}</span> high
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <Link
                      to={`/exams/${exam.id}/report`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      View report
                      <ArrowRight size={15} />
                    </Link>
                    <Link
                      to={`/exams/${exam.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
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
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox size={24} />
      </span>
      <h3 className="text-base font-medium text-slate-900 font-display">
        No reports yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
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
