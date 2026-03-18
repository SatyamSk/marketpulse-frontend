import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { DisclaimerFooter } from "./DisclaimerFooter";
import { DisclaimerModal } from "./DisclaimerModal";
import marketBg from "@/assets/market-bg.jpg";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full relative">
      <DisclaimerModal />

      {/* Background */}
      <div
        className="fixed inset-0 z-0 opacity-20"
        style={{
          backgroundImage:  `url(${marketBg})`,
          backgroundSize:   "cover",
          backgroundPosition: "center",
          filter:           "blur(40px)",
        }}
      />
      <div className="fixed inset-0 z-0 bg-background/85" />

      <div className="relative z-10 flex w-full overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:p-8">
            {children}
          </main>
          <DisclaimerFooter />
        </div>
      </div>
    </div>
  );
}
