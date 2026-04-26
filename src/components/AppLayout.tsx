import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="page-mount px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 max-w-[1400px] mx-auto pb-20 lg:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
