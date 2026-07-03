"use client";

import { useEffect } from "react";

const APP_NAME = "Mocko";

export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) {
      return;
    }
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);
}
