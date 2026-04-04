import type { Mock } from "@/lib/types/mock";

export const FIXTURE_MOCKS: Mock[] = [
  {
    id: "1",
    name: "Get user profile",
    method: "GET",
    path: "/api/users/:id",
    isEnabled: true,
    annotations: [],
    response: {
      code: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        { id: "{{params.id}}", name: "John Doe", email: "john@example.com" },
        null,
        2,
      ),
    },
  },
  {
    id: "2",
    name: "Create order",
    method: "POST",
    path: "/api/orders",
    isEnabled: false,
    annotations: [],
    response: {
      code: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "ord_123", status: "created" }, null, 2),
    },
  },
  {
    id: "3",
    name: "Feature flag override",
    method: "GET",
    path: "/api/flags",
    isEnabled: true,
    annotations: ["TEMPORARY"],
    response: {
      code: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_checkout: true, dark_mode: false }, null, 2),
    },
  },
  {
    id: "4",
    name: "Health check",
    method: "GET",
    path: "/health",
    isEnabled: true,
    annotations: ["READ_ONLY"],
    response: {
      code: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ok" }, null, 2),
    },
  },
  {
    id: "5",
    name: "Delete account",
    method: "DELETE",
    path: "/api/users/:id",
    isEnabled: false,
    annotations: ["TEMPORARY", "READ_ONLY"],
    response: {
      code: 204,
      headers: {},
      body: undefined,
    },
  },
];
