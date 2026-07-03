import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import NewMockPage from "./page";
import { aHost, aMock, aMockDetails } from "@/test/fixtures";
import { givenApi, givenApiError, server } from "@/test/msw";
import { givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import type { CreateMockDto } from "@/lib/types/mock-dtos";

function capturePosts(): CreateMockDto[] {
  const payloads: CreateMockDto[] = [];
  server.use(
    http.post("/api/mocks", async ({ request }) => {
      payloads.push((await request.json()) as CreateMockDto);
      return HttpResponse.json(aMockDetails(), { status: 201 });
    }),
  );
  return payloads;
}

async function findCreateForm() {
  return await screen.findByRole("form", { name: "Create mock" });
}

async function fillRequiredFields(
  user: UserEvent,
  { name = "Get users", path = "/users" } = {},
) {
  await user.type(screen.getByLabelText("Name"), name);
  await user.type(screen.getByLabelText("Path"), path);
}

async function setStatusCode(user: UserEvent, value: string) {
  const input = screen.getByLabelText("Status code");
  await user.clear(input);
  if (value) {
    await user.type(input, value);
  }
}

describe("new mock page focus", () => {
  it("autofocuses the name field", async () => {
    givenApi();
    renderWithProviders(<NewMockPage />);

    await findCreateForm();
    expect(screen.getByLabelText("Name")).toHaveFocus();
  });
});

describe("new mock page payload mapping", () => {
  it("sends the mapped payload and redirects after a successful create", async () => {
    givenApi();
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await fillRequiredFields(user, { name: "  Get users  " });
    const body = await screen.findByRole("textbox", { name: "Code editor" });
    await user.click(body);
    await user.paste('{"id": 1}');

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Mock created.")).toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/mocks");
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toEqual({
      format: "json",
      name: "Get users",
      method: "GET",
      path: "/users",
      host: null,
      labels: [],
      response: {
        code: 200,
        body: '{"id": 1}',
        headers: {},
      },
    });
    expect(payloads[0].response).not.toHaveProperty("delay");
  });

  it("omits the format and the body when Other is selected and the body is empty", async () => {
    givenApi();
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Other" }));
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(payloads).toHaveLength(1));
    expect(payloads[0]).not.toHaveProperty("format");
    expect(payloads[0].response).not.toHaveProperty("body");
  });

  it("maps the selected host into the payload and Any host back to null", async () => {
    givenApi({ hosts: [aHost({ slug: "payments", name: "Payments" })] });
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await fillRequiredFields(user);
    await user.click(screen.getByText("Advanced options"));

    await user.click(screen.getByLabelText("Host"));
    await user.click(
      await screen.findByRole("option", { name: "payments (Payments)" }),
    );
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(payloads).toHaveLength(1));
    expect(payloads[0].host).toBe("payments");

    await user.click(screen.getByLabelText("Host"));
    await user.click(await screen.findByRole("option", { name: "Any host" }));
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(payloads).toHaveLength(2));
    expect(payloads[1].host).toBeNull();
  });

  it("suggests creating a host when none exist", async () => {
    givenApi();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await user.click(screen.getByText("Advanced options"));

    expect(screen.getByText(/No hosts defined/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create one on the Hosts page" }),
    ).toHaveAttribute("href", "/hosts");
  });

  it("reflects picked, created and removed labels in the payload", async () => {
    givenApi({ mocks: [aMock({ labels: ["users", "admin"] })] });
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await fillRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Add label" }));
    await user.click(await screen.findByRole("option", { name: "users" }));
    await user.type(screen.getByPlaceholderText("Search or create…"), "qa");
    await user.click(
      await screen.findByRole("option", { name: "Create “qa”" }),
    );
    await user.keyboard("{Escape}");

    await user.click(
      screen.getByRole("button", { name: "Remove label users" }),
    );
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(payloads).toHaveLength(1));
    expect(payloads[0].labels).toEqual(["qa"]);
  });
});

describe("new mock page validation", () => {
  it("shows inline errors, sends nothing, and hides them again while editing", async () => {
    givenApi();
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await setStatusCode(user, "");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Path is required.")).toBeInTheDocument();
    expect(screen.getByText("Status code is required.")).toBeInTheDocument();
    expect(payloads).toHaveLength(0);

    await user.type(screen.getByLabelText("Name"), "My mock");
    expect(screen.queryByText("Path is required.")).not.toBeInTheDocument();
  });

  // Out-of-range values are stopped before any request: the browser's own
  // min/max constraint validation blocks the submit, so the only observable
  // outcome is that nothing reaches the API.
  it("blocks invalid status codes and accepts the 599 boundary", async () => {
    givenApi();
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await fillRequiredFields(user);

    for (const invalid of ["199", "600", "20.5"]) {
      await setStatusCode(user, invalid);
      await user.click(screen.getByRole("button", { name: "Create" }));
      expect(payloads).toHaveLength(0);
    }
    expect(screen.queryByText("Mock created.")).not.toBeInTheDocument();

    await setStatusCode(user, "599");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(payloads).toHaveLength(1));
    expect(payloads[0].response.code).toBe(599);
  });

  it("blocks out-of-range delays and sends the 300000 boundary", async () => {
    givenApi();
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await fillRequiredFields(user);
    await user.click(screen.getByText("Advanced options"));
    const delay = screen.getByLabelText("Delay (ms)");

    for (const invalid of ["-1", "300001"]) {
      await user.clear(delay);
      await user.type(delay, invalid);
      await user.click(screen.getByRole("button", { name: "Create" }));
      expect(payloads).toHaveLength(0);
    }

    await user.clear(delay);
    await user.type(delay, "300000");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(payloads).toHaveLength(1));
    expect(payloads[0].response.delay).toBe(300000);
  });

  it("rejects paths under the reserved /__mocko__ prefix", async () => {
    givenApi();
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await user.type(screen.getByLabelText("Name"), "Reserved");
    const path = screen.getByLabelText("Path");

    await user.type(path, "__mocko__/internal");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByText('Path cannot start with "/__mocko__/".'),
    ).toBeInTheDocument();

    await user.clear(path);
    await user.type(path, "/__mocko__/internal");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByText('Path cannot start with "/__mocko__/".'),
    ).toBeInTheDocument();

    expect(payloads).toHaveLength(0);
  });

  it("warns about :param path syntax but not about {param}", async () => {
    givenApi();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    const path = screen.getByLabelText("Path");

    await user.type(path, "/users/:id");
    expect(
      screen.getByText("Path parameters use {param} syntax, not :param."),
    ).toBeInTheDocument();

    await user.clear(path);
    await user.click(path);
    await user.paste("/users/{id}");
    expect(
      screen.queryByText("Path parameters use {param} syntax, not :param."),
    ).not.toBeInTheDocument();
  });

  it("warns when the delay looks like seconds instead of milliseconds", async () => {
    givenApi();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await user.click(screen.getByText("Advanced options"));
    const delay = screen.getByLabelText("Delay (ms)");

    await user.type(delay, "30");
    expect(
      screen.getByText("Delay is in milliseconds, not seconds."),
    ).toBeInTheDocument();

    await user.clear(delay);
    await user.type(delay, "50");
    expect(
      screen.queryByText("Delay is in milliseconds, not seconds."),
    ).not.toBeInTheDocument();
  });
});

describe("new mock page content types", () => {
  it("locks the Content-Type header to the selected format", async () => {
    givenApi();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await user.click(screen.getByText("Advanced options"));

    expect(screen.getByLabelText("Locked header name 1")).toHaveValue(
      "Content-Type",
    );
    expect(screen.getByLabelText("Locked header value 1")).toHaveValue(
      "application/json",
    );

    await user.click(screen.getByRole("button", { name: "XML" }));
    expect(screen.getByLabelText("Locked header value 1")).toHaveValue(
      "application/xml",
    );

    await user.click(screen.getByRole("button", { name: "Other" }));
    expect(
      screen.queryByLabelText("Locked header name 1"),
    ).not.toBeInTheDocument();
  });

  it("hints when a manual Content-Type header conflicts with the format", async () => {
    givenApi();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await user.click(screen.getByText("Advanced options"));
    await user.click(screen.getByRole("button", { name: "Add header" }));
    await user.type(screen.getByLabelText("Header name 1"), "Content-Type");

    expect(
      screen.getByText(
        "Content-Type is already set by the selected body format.",
      ),
    ).toBeInTheDocument();
  });
});

describe("new mock page server errors", () => {
  it("maps server field validation errors onto the form", async () => {
    givenApi();
    server.use(
      http.post("/api/mocks", () =>
        HttpResponse.json(
          {
            code: "BAD_REQUEST",
            message: "Request body validation failed",
            errors: {
              formErrors: ["Something is wrong with this mock"],
              fieldErrors: { name: ["Name is already in use"] },
            },
          },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("Name is already in use"),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something is wrong with this mock",
    );
    expect(router.push).not.toHaveBeenCalledWith("/mocks");
  });

  it("shows the template callout on TEMPLATE_PARSE_ERROR", async () => {
    givenApi();
    server.use(
      http.post("/api/mocks", () =>
        HttpResponse.json(
          {
            code: "TEMPLATE_PARSE_ERROR",
            message: "Unclosed expression",
            parsingError: {
              message: "Unclosed expression",
              line: 1,
              column: 5,
            },
          },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("There is an issue with your template"),
    ).toBeInTheDocument();
    expect(screen.getByText("Unclosed expression")).toBeInTheDocument();
  });

  it("toasts and stays editable on unexpected server errors", async () => {
    givenApi();
    givenApiError("post", "/api/mocks");
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Failed to save mock.")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Get users");
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });
});

describe("new mock page duplicate flow", () => {
  it("prefills a copy of the source mock and creates a new one", async () => {
    givenRoute({ pathname: "/mocks/new", search: "from=mock-src" });
    givenApi({
      mockDetails: [
        aMockDetails({
          id: "mock-src",
          name: "Source mock",
          method: "POST",
          path: "/src",
          format: "xml",
          labels: ["users"],
          filePath: "mocks/src.hcl",
          annotations: ["READ_ONLY"],
          response: {
            code: 201,
            delay: 100,
            body: "<a/>",
            headers: {
              "Content-Type": "application/xml",
              "X-Extra": "1",
            },
          },
        }),
      ],
    });
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewMockPage />);

    await findCreateForm();
    expect(screen.getByLabelText("Name")).toHaveValue("Source mock (copy)");
    expect(screen.getByLabelText("Path")).toHaveValue("/src");
    expect(screen.getByLabelText("Status code")).toHaveValue(201);
    expect(screen.getByLabelText("HTTP method")).toHaveTextContent("POST");
    expect(screen.queryByLabelText("Source file")).not.toBeInTheDocument();
    expect(
      await screen.findByRole("textbox", { name: "Code editor" }),
    ).toHaveValue("<a/>");

    await user.click(screen.getByText("Advanced options"));
    expect(screen.getByLabelText("Delay (ms)")).toHaveValue(100);
    expect(screen.getByLabelText("Locked header value 1")).toHaveValue(
      "application/xml",
    );
    expect(screen.getByLabelText("Header name 1")).toHaveValue("X-Extra");
    expect(screen.queryByLabelText("Header name 2")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(payloads).toHaveLength(1));
    expect(payloads[0]).toEqual({
      format: "xml",
      name: "Source mock (copy)",
      method: "POST",
      path: "/src",
      host: null,
      labels: ["users"],
      response: {
        code: 201,
        delay: 100,
        body: "<a/>",
        headers: { "X-Extra": "1" },
      },
    });
  });

  it("shows the not-found state when the source mock is missing", async () => {
    givenRoute({ pathname: "/mocks/new", search: "from=missing" });
    givenApi();
    renderWithProviders(<NewMockPage />);

    expect(await screen.findByText("Mock not found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The mock to duplicate does not exist or is no longer available.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to mocks" }),
    ).toHaveAttribute("href", "/mocks");
  });

  it("shows the load-error callout when fetching the source fails", async () => {
    givenRoute({ pathname: "/mocks/new", search: "from=mock-src" });
    givenApi();
    givenApiError("get", "/api/mocks/:id");
    renderWithProviders(<NewMockPage />);

    expect(await screen.findByText("Could not load mock")).toBeInTheDocument();
  });
});
