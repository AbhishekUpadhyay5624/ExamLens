import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import AnimatedGridBackground from "./AnimatedGridBackground";

// App shell for authenticated pages: navbar + centered content column.
export default function Layout() {
  return (
    <div className="min-h-screen">
      <AnimatedGridBackground />
      <Navbar />
      <main className="mx-auto w-full max-w-[95%] xl:max-w-[1600px] px-4 py-8 sm:px-8 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
