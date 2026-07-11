import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockActionsMenu } from "@/components/mock-actions-menu";
import { Button } from "@/components/ui/button";
import type { MockDto } from "@/lib/types/mock-dtos";
import { aHost, aMock, aMockDetails } from "@/test/fixtures";
import { givenApi, givenApiError } from "@/test/msw";
import { renderWithProviders } from "@/test/render";

function renderMenu(mock: MockDto) {
  return renderWithProviders(
    <MockActionsMenu
      mock={mock}
      trigger={<Button aria-label={`Actions for ${mock.name}`} />}
      onDelete={() => {}}
      onToggleEnabled={() => {}}
      onDuplicate={() => {}}
    />,
  );
}

async function clickCopyAsCurl(user: {
  click: (element: Element) => Promise<void>;
}) {
  await user.click(screen.getByRole("button", { name: /^Actions for/ }));
  await user.click(
    await screen.findByRole("menuitem", { name: "Copy as curl" }),
  );
}

describe("MockActionsMenu copy as curl", () => {
  it("copies a curl built from the saved mock and the configured base URL", async () => {
    const details = aMockDetails({
      method: "POST",
      path: "/orders/{orderId}",
      response: {
        code: 200,
        delay: undefined,
        body: '{"name": "{{request.body.name}}"}',
        headers: {},
      },
    });
    givenApi({
      mockDetails: [details],
      versions: {
        control: "0.0.0-test",
        core: "0.0.0-test",
        mockBaseUrl: "https://mocks.acme.dev",
      },
    });
    const { user } = renderMenu(aMock({ id: details.id, name: details.name }));

    await clickCopyAsCurl(user);

    expect(
      await screen.findByText("curl command copied to clipboard."),
    ).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe(
      [
        "curl -X POST 'https://mocks.acme.dev/orders/ORDERID' \\",
        "  -H 'Content-Type: application/json' \\",
        "  --data '{",
        '    "name": ""',
        "  }'",
      ].join("\n"),
    );
  });

  it("resolves the mock's host slug against the hosts list", async () => {
    const host = aHost({ slug: "api", source: "api.example.com" });
    const details = aMockDetails({ path: "/users", host: "api" });
    givenApi({ mockDetails: [details], hosts: [host] });
    const { user } = renderMenu(
      aMock({ id: details.id, name: details.name, host: "api" }),
    );

    await clickCopyAsCurl(user);

    expect(await navigator.clipboard.readText()).toBe(
      [
        "curl 'http://localhost:8080/users' \\",
        "  -H 'Host: api.example.com'",
      ].join("\n"),
    );
  });

  it("shows the item for read-only mocks", async () => {
    const details = aMockDetails({ annotations: ["READ_ONLY"] });
    givenApi({ mockDetails: [details] });
    const { user } = renderMenu(
      aMock({
        id: details.id,
        name: details.name,
        annotations: ["READ_ONLY"],
      }),
    );

    await user.click(screen.getByRole("button", { name: /^Actions for/ }));

    expect(
      await screen.findByRole("menuitem", { name: "Copy as curl" }),
    ).toBeInTheDocument();
  });

  it("toasts an error when the mock details cannot be fetched", async () => {
    givenApi();
    givenApiError("get", "/api/mocks/:id");
    const { user } = renderMenu(aMock());

    await clickCopyAsCurl(user);

    expect(
      await screen.findByText("Couldn't copy curl command."),
    ).toBeInTheDocument();
  });
});
