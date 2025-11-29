import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import CategoryServices from "./pages/CategoryServices";
import BookingForm from "./pages/BookingForm";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import ServiceProviderDashboard from "./pages/ServiceProviderDashboard";
import NotFound from "./pages/NotFound";
import MyBookings from "./pages/MyBookings";
import ScrollToTop from "./components/ScrollToTop"; // The new component

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          {/* This will scroll to top on every route change */}
          <ScrollToTop />
          
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/category/:categoryId" element={<CategoryServices />} />
            <Route path="/book/:serviceId" element={<BookingForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/service-provider" element={<ServiceProviderDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;