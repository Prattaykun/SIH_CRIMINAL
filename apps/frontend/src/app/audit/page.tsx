"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AuditPage() {
  const router = useRouter();

  useEffect(() => {
    async function fetchAndRedirect() {
      try {
        const res = await api.listCases();
        if (res.cases && res.cases.length > 0) {
          router.push(`/cases/${res.cases[0].id}`);
        } else {
          router.push("/cases");
        }
      } catch {
        router.push("/cases");
      }
    }
    fetchAndRedirect();
  }, [router]);

  return (
    <div className="-m-5 space-y-0 sm:-m-6 lg:-m-8">
      <PageHeader
        badge="System"
        title="Verification"
        description="Routing to an active case for human-in-the-loop review..."
      />
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    </div>
  );
}
