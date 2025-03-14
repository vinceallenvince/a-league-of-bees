import { ReactNode } from "react";
import Navbar from "@/core/components/navbar";
import Footer from "@/core/components/footer";
import { Toaster } from "@/core/ui/toaster";

interface CoreLayoutProps {
  children: ReactNode;
}

/**
 * CoreLayout provides a consistent layout structure for the application.
 * It includes the Navbar, main content area, Footer, and Toaster components.
 */
export default function CoreLayout({ children }: CoreLayoutProps) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <Toaster />
    </>
  );
} 