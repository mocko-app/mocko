import { describe, expect, it } from "vitest";
import { buildMockCurl } from "@/lib/frontend/mock-curl";
import type { HttpMethod } from "@/lib/types/mock";

function curlOf({
  method = "GET" as HttpMethod,
  path = "/users",
  host = undefined as string | undefined,
  template = undefined as string | undefined,
  baseUrl = "http://localhost:8080",
  hosts = [] as { slug: string; source: string }[],
} = {}) {
  return buildMockCurl(
    {
      method,
      path,
      host,
      response: { code: 200, delay: undefined, body: template, headers: {} },
    },
    baseUrl,
    hosts,
  );
}

describe("buildMockCurl", () => {
  describe("URL and method", () => {
    it("collapses to a bare one-liner for a GET without template references", () => {
      expect(curlOf()).toBe("curl 'http://localhost:8080/users'");
    });

    it("adds -X for non-GET methods", () => {
      expect(curlOf({ method: "DELETE" })).toBe(
        "curl -X DELETE 'http://localhost:8080/users'",
      );
    });

    it("strips trailing slashes from the base URL", () => {
      expect(curlOf({ baseUrl: "https://mocks.acme.dev///" })).toBe(
        "curl 'https://mocks.acme.dev/users'",
      );
    });

    it("uppercases path parameters", () => {
      expect(curlOf({ path: "/users/{userId}/plans/{plan_id}" })).toBe(
        "curl 'http://localhost:8080/users/USERID/plans/PLAN_ID'",
      );
    });

    it("strips wildcard and optional markers from path parameters", () => {
      expect(curlOf({ path: "/files/{filePath*}" })).toBe(
        "curl 'http://localhost:8080/files/FILEPATH'",
      );
      expect(curlOf({ path: "/files/{segments*2}" })).toBe(
        "curl 'http://localhost:8080/files/SEGMENTS'",
      );
      expect(curlOf({ path: "/users/{id?}" })).toBe(
        "curl 'http://localhost:8080/users/ID'",
      );
    });
  });

  describe("query parameters", () => {
    it("appends empty query placeholders in template order, deduplicated", () => {
      const template =
        "{{request.query.page}} {{request.query.size}} {{request.query.page}}";
      expect(curlOf({ template })).toBe(
        "curl 'http://localhost:8080/users?page=&size='",
      );
    });

    it("only uses the first segment of nested query references", () => {
      expect(curlOf({ template: "{{request.query.filter.name}}" })).toBe(
        "curl 'http://localhost:8080/users?filter='",
      );
    });
  });

  describe("headers", () => {
    it("emits title-cased header placeholders", () => {
      const template =
        "{{request.headers.x-api-key}} {{request.headers.authorization}}";
      expect(curlOf({ template })).toBe(
        [
          "curl 'http://localhost:8080/users' \\",
          "  -H 'X-Api-Key: ' \\",
          "  -H 'Authorization: '",
        ].join("\n"),
      );
    });

    it("skips pseudo-headers the client sends anyway", () => {
      const template = [
        "{{request.headers.host}}",
        "{{request.headers.content-type}}",
        "{{request.headers.content-length}}",
        "{{request.headers.accept}}",
        "{{request.headers.user-agent}}",
      ].join(" ");
      expect(curlOf({ template })).toBe("curl 'http://localhost:8080/users'");
    });

    it("deduplicates repeated header references", () => {
      const template =
        "{{request.headers.x-token}} {{request.headers.x-token}}";
      expect(curlOf({ template })).toBe(
        ["curl 'http://localhost:8080/users' \\", "  -H 'X-Token: '"].join(
          "\n",
        ),
      );
    });
  });

  describe("host-scoped mocks", () => {
    it("resolves a host slug to its source and sends it as the Host header", () => {
      expect(
        curlOf({
          host: "api",
          hosts: [{ slug: "api", source: "api.example.com" }],
        }),
      ).toBe(
        [
          "curl 'http://localhost:8080/users' \\",
          "  -H 'Host: api.example.com'",
        ].join("\n"),
      );
    });

    it("uses an unresolvable host value verbatim", () => {
      expect(curlOf({ host: "raw.example.com" })).toBe(
        [
          "curl 'http://localhost:8080/users' \\",
          "  -H 'Host: raw.example.com'",
        ].join("\n"),
      );
    });
  });

  describe("body skeleton", () => {
    it("builds a pretty-printed body from request.body references", () => {
      const template =
        '{"a": "{{request.body.yada}}", "b": "{{request.body.foo.bar}}"}';
      expect(curlOf({ method: "POST", template })).toBe(
        [
          "curl -X POST 'http://localhost:8080/users' \\",
          "  -H 'Content-Type: application/json' \\",
          "  --data '{",
          '    "yada": "",',
          '    "foo": {',
          '      "bar": ""',
          "    }",
          "  }'",
        ].join("\n"),
      );
    });

    it("lets deeper paths win over shallower ones", () => {
      const template = "{{request.body.foo}} {{request.body.foo.bar}}";
      expect(curlOf({ method: "POST", template })).toContain(
        [
          "  --data '{",
          '    "foo": {',
          '      "bar": ""',
          "    }",
          "  }'",
        ].join("\n"),
      );
    });

    it("renders each and forEach targets as arrays", () => {
      const template =
        "{{#each request.body.tags}}{{$this}}{{/each}}" +
        "{{#forEach request.body.items}}{{item}}{{/forEach}}";
      expect(curlOf({ method: "POST", template })).toContain(
        ["  --data '{", '    "tags": [],', '    "items": []', "  }'"].join(
          "\n",
        ),
      );
    });

    it("prefers deeper object references over an each target on the same path", () => {
      const template =
        "{{#forEach request.body.items}}{{/forEach}} {{request.body.items.total}}";
      expect(curlOf({ method: "POST", template })).toContain(
        ['    "items": {', '      "total": ""', "    }"].join("\n"),
      );
    });

    it("resolves $root and $parent prefixes", () => {
      const template =
        "{{$root.request.body.a}} {{$parent.request.body.b}} {{$parent.request.query.q}}";
      const curl = curlOf({ method: "POST", template });
      expect(curl).toContain('"a": ""');
      expect(curl).toContain('"b": ""');
      expect(curl).toContain("?q=");
    });

    it("catches references in variable extractions and helper arguments", () => {
      const template =
        "{{= $name request.body.name}} {{upper request.body.title}}";
      const curl = curlOf({ method: "POST", template });
      expect(curl).toContain('"name": ""');
      expect(curl).toContain('"title": ""');
    });

    it("renders bare request.body as an empty object", () => {
      expect(curlOf({ method: "POST", template: "{{request.body}}" })).toBe(
        [
          "curl -X POST 'http://localhost:8080/users' \\",
          "  -H 'Content-Type: application/json' \\",
          "  --data '{}'",
        ].join("\n"),
      );
    });

    it("treats a direct object block over request.body as a bare reference", () => {
      expect(
        curlOf({
          method: "POST",
          template: "{{#request.body}}{{name}}{{/request.body}}",
        }),
      ).toContain("--data '{}'");
    });

    it("renders an each over bare request.body as an empty array", () => {
      expect(
        curlOf({
          method: "POST",
          template: "{{#forEach request.body}}{{item}}{{/forEach}}",
        }),
      ).toContain("--data '[]'");
    });

    it("keeps -X GET when a GET mock reads the request body", () => {
      expect(curlOf({ template: "{{request.body.q}}" })).toBe(
        [
          "curl -X GET 'http://localhost:8080/users' \\",
          "  -H 'Content-Type: application/json' \\",
          "  --data '{",
          '    "q": ""',
          "  }'",
        ].join("\n"),
      );
    });

    it("does not match identifiers that merely start with request.body", () => {
      expect(curlOf({ template: "{{request.bodyText}}" })).toBe(
        "curl 'http://localhost:8080/users'",
      );
    });
  });

  it("assembles the full command with host, headers, query and body", () => {
    const template = [
      "{{request.headers.x-api-key}}",
      "{{request.query.verbose}}",
      '{"name": "{{request.body.yada}}", "bar": "{{request.body.foo.bar}}"}',
    ].join("\n");

    expect(
      curlOf({
        method: "POST",
        path: "/users/{userId}",
        host: "api",
        hosts: [{ slug: "api", source: "api.example.com" }],
        template,
      }),
    ).toBe(
      [
        "curl -X POST 'http://localhost:8080/users/USERID?verbose=' \\",
        "  -H 'Host: api.example.com' \\",
        "  -H 'X-Api-Key: ' \\",
        "  -H 'Content-Type: application/json' \\",
        "  --data '{",
        '    "yada": "",',
        '    "foo": {',
        '      "bar": ""',
        "    }",
        "  }'",
      ].join("\n"),
    );
  });
});
