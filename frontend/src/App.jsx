import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import About from "./pages/About";
import ExamsList from "./pages/ExamsList";
import Reports from "./pages/Reports";
import Upload from "./pages/Upload";
import ExamDashboard from "./pages/ExamDashboard";
import EventDetail from "./pages/EventDetail";
import Report from "./pages/Report";
import PageTransition from "./components/PageTransition";

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence>
      <Routes location={location} key={location.pathname}>
        {/* Public authentication */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

        {/* Public Landing & About Pages (with Layout Navbar) */}
        <Route
          element={
            <PageTransition>
              <Layout />
            </PageTransition>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Route>

        {/* Protected examination management routes */}
        <Route
          element={
            <ProtectedRoute>
              <PageTransition>
                <Layout />
              </PageTransition>
            </ProtectedRoute>
          }
        >
          <Route path="/uploads" element={<ExamsList />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/exams/:id" element={<ExamDashboard />} />
          <Route path="/exams/:id/report" element={<Report />} />
          <Route path="/events/:id" element={<EventDetail />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
