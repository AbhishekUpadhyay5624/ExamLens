import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

// App shell for authenticated pages: navbar + centered content column.
export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
