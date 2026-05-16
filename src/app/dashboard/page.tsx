"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { dashboardPathForRole } from "@/lib/auth-redirect";
import { useVeltrix } from "@/lib/store";

export default function DashboardGateway() {
  const router = useRouter();
  const { user, isLoaded } = useVeltrix();

  useEffect(() => {
    if (isLoaded && user) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isLoaded, router, user]);

  if (!isLoaded || user) {
    return (
      <div className="loading-screen">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.5 }}
        >
          ROUTING DASHBOARD...
        </motion.span>
      </div>
    );
  }

  return (
    <main className="dashboard-gateway">
      <section className="dashboard-gateway-card">
        <span className="sticker">DASHBOARD ACCESS</span>
        <h1 className="font-bangers">Pick up where your campus run starts.</h1>
        <p className="font-space">
          Sign in to open your student arena, club command panel, or admin command center.
        </p>
        <div className="dashboard-gateway-actions">
          <Link href="/auth" className="btn btn-green">
            LOGIN
          </Link>
          <Link href="/events" className="btn btn-black">
            BROWSE EVENTS
          </Link>
        </div>
      </section>
    </main>
  );
}
