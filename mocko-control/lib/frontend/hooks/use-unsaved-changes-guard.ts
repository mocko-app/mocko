"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useUnsavedChangesGuard(isDirty: boolean) {
  const router = useRouter();
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function navigateWithGuard(href: string) {
    if (isDirty) {
      setPendingNavigation(href);
      return;
    }
    router.push(href);
  }

  function confirmDiscard() {
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    setPendingNavigation(null);
  }

  function keepEditing() {
    setPendingNavigation(null);
  }

  return {
    isConfirmingDiscard: pendingNavigation !== null,
    confirmDiscard,
    keepEditing,
    navigateWithGuard,
  };
}
