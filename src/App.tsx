import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import ComingSoon from "./pages/ComingSoon";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route
              path="/purchases"
              element={
                <ComingSoon
                  title="Purchase Tracking"
                  subtitle="Daily purchases from the company, with invoice photos."
                  icon="📦"
                  blurb="Log how many of each product you bought today, attach the company invoice, and see the month-at-a-glance summary. Building this in the next pass."
                />
              }
            />
            <Route
              path="/sales"
              element={
                <ComingSoon
                  title="Sales Tracking"
                  subtitle="Customer-by-customer billing, route-style."
                  icon="🧾"
                  blurb="Pick a date, walk through your customer list, and enter quantities per product. Amounts roll up live. Coming next."
                />
              }
            />
            <Route
              path="/crates"
              element={
                <ComingSoon
                  title="Crate Management"
                  subtitle="Opening · received · given · closing."
                  icon="🟩"
                  blurb="Daily crate ledger with auto opening stock from yesterday's closing. Coming next."
                />
              }
            />
            <Route
              path="/reports"
              element={
                <ComingSoon
                  title="Reports & Export"
                  subtitle="A clean monthly Excel for your CA."
                  icon="📊"
                  blurb="Download a neatly-formatted .xlsx with separate sheets for purchases, sales and crates — or email it straight to your CA. Coming next."
                />
              }
            />
            <Route
              path="/settings"
              element={
                <ComingSoon
                  title="Settings"
                  subtitle="Business name and CA email."
                  icon="⚙️"
                  blurb="Set your business name and the email address your monthly report should go to. Coming next."
                />
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
