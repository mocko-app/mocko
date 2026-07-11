const KEY_PREFIX = "mocko:skip-confirmation";

function getPreferenceKey(resource: string, action: string) {
  return `${KEY_PREFIX}:${resource}:${action}`;
}

export function shouldSkipConfirmation(resource: string, action: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.sessionStorage.getItem(getPreferenceKey(resource, action)) ===
      "true"
    );
  } catch {
    return false;
  }
}

export function skipConfirmation(resource: string, action: string) {
  try {
    window.sessionStorage.setItem(getPreferenceKey(resource, action), "true");
  } catch {
    return;
  }
}
