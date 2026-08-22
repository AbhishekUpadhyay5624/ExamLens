import { Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected — share the Layout (navbar + content column) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/uploads" element={<ExamsList />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/about" element={<About />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/exams/:id" element={<ExamDashboard />} />
        <Route path="/exams/:id/report" element={<Report />} />
        <Route path="/events/:id" element={<EventDetail />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
