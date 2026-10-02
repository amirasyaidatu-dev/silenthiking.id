import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/context/SettingsContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import Landing from "@/pages/Landing";
import Experiences from "@/pages/Experiences";
import TripDetail from "@/pages/TripDetail";
import Shop from "@/pages/Shop";
import ApparelDetail from "@/pages/ApparelDetail";
import Journal from "@/pages/Journal";
import BlogDetail from "@/pages/BlogDetail";
import BookingConfirmation from "@/pages/BookingConfirmation";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";

const ProtectedRoute = ({ children }) => {
  const { admin, checked } = useAuth();
  if (!checked) return <div className="min-h-screen flex items-center justify-center bg-bone text-charcoal/50">Memuat…</div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <SettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/experiences" element={<Experiences />} />
              <Route path="/trips/:slug" element={<TripDetail />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/apparel/:slug" element={<ApparelDetail />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/journal/:slug" element={<BlogDetail />} />
              <Route path="/booking/:code" element={<BookingConfirmation />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-center" richColors />
          </BrowserRouter>
        </AuthProvider>
      </SettingsProvider>
    </div>
  );
}

export default App;
