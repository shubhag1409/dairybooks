import { supabase } from "@/integrations/supabase/client";

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const monthBounds = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 1);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};

export const currentMonth = () => todayISO().slice(0, 7);

export const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export const getUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Please sign in again");
  return user.id;
};

export type Product = { id: string; name: string; rate: number; unit: string };
export type Customer = { id: string; name: string; phone: string | null; address: string | null };
