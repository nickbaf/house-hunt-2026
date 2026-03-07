import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { Navbar } from "@/components/Navbar";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { PropertyDetail } from "@/pages/PropertyDetail";
import { AddProperty } from "@/pages/AddProperty";
import { Compare } from "@/pages/Compare";
import { MapView } from "@/pages/MapView";
import { Loader2 } from "lucide-react";

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <DataProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/add" element={<AddProperty />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/map" element={<MapView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/house-hunt-2026">
      <AuthProvider>
        <ProtectedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
