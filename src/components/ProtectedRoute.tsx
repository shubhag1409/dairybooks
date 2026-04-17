import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    // Skeleton placeholder — never a spinner
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-64 space-y-3">
          <span className="skel block h-3 w-40 rounded" />
          <span className="skel block h-3 w-56 rounded" />
          <span className="skel block h-3 w-32 rounded" />
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
