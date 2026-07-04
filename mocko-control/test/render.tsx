import { render, type RenderResult } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/sonner";

export type RenderWithProvidersResult = RenderResult & {
  user: UserEvent;
};

export function renderWithProviders(
  ui: React.ReactElement,
): RenderWithProvidersResult {
  const user = userEvent.setup();
  const result = render(
    <SWRConfig
      value={{
        provider: () => new Map(),
        dedupingInterval: 0,
        focusThrottleInterval: 0,
        shouldRetryOnError: false,
      }}
    >
      {ui}
      <Toaster />
    </SWRConfig>,
  );

  return { user, ...result };
}
