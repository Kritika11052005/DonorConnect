"use client";

import { LoadingScreen } from "@/components/LoadingScreen";
import { useState, useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading DonorConnect..." />;
  }

  return <>{children}</>;
}