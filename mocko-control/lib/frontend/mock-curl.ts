import type { HostDto } from "@/lib/types/host-dtos";
import type { MockDetailsDto } from "@/lib/types/mock-dtos";

const REQUEST_REF =
  /(?:\$(?:root|parent)\.)*request\.(body|headers|query)(?![\w-])((?:\.[\w-]+)*)/g;
const EACH_BODY_REF =
  /\{\{#(?:each|forEach)\s+(?:\$(?:root|parent)\.)*request\.body(?![\w-])((?:\.[\w-]+)*)/g;
const PATH_PARAM = /\{([\w-]+)(?:\*\d*|\?)?\}/g;

const PSEUDO_HEADERS = new Set([
  "host",
  "content-type",
  "content-length",
  "accept",
  "user-agent",
]);

type HostSource = Pick<HostDto, "slug" | "source">;

type BodyNode = {
  children: Map<string, BodyNode>;
  isArray: boolean;
};

type TemplateRefs = {
  bodyPaths: string[][];
  arrayPaths: string[][];
  hasBareBody: boolean;
  bodyIsArray: boolean;
  queryKeys: string[];
  headerNames: string[];
};

export function buildMockCurl(
  mock: Pick<MockDetailsDto, "method" | "path" | "host" | "response">,
  baseUrl: string,
  hosts: readonly HostSource[],
): string {
  const refs = scanTemplate(mock.response.body ?? "");
  const body = buildBodySkeleton(refs);

  const url = buildUrl(baseUrl, mock.path, refs.queryKeys);
  const methodFlag =
    mock.method !== "GET" || body !== undefined ? ` -X ${mock.method}` : "";

  const flags: string[] = [];
  const hostSource = resolveHostSource(mock.host, hosts);
  if (hostSource) {
    flags.push(`-H 'Host: ${hostSource}'`);
  }
  for (const name of refs.headerNames) {
    flags.push(`-H '${titleCaseHeader(name)}: '`);
  }
  if (body !== undefined) {
    flags.push("-H 'Content-Type: application/json'");
    flags.push(`--data '${indentContinuationLines(body)}'`);
  }

  return [`curl${methodFlag} '${url}'`, ...flags].join(" \\\n  ");
}

function scanTemplate(template: string): TemplateRefs {
  const refs: TemplateRefs = {
    bodyPaths: [],
    arrayPaths: [],
    hasBareBody: false,
    bodyIsArray: false,
    queryKeys: [],
    headerNames: [],
  };

  for (const match of template.matchAll(REQUEST_REF)) {
    const target = match[1];
    const segments = match[2].split(".").filter(Boolean);

    if (target === "body") {
      if (segments.length === 0) {
        refs.hasBareBody = true;
      } else {
        refs.bodyPaths.push(segments);
      }
    } else if (segments.length > 0) {
      const key = segments[0];
      if (target === "query" && !refs.queryKeys.includes(key)) {
        refs.queryKeys.push(key);
      }
      if (
        target === "headers" &&
        !PSEUDO_HEADERS.has(key.toLowerCase()) &&
        !refs.headerNames.includes(key)
      ) {
        refs.headerNames.push(key);
      }
    }
  }

  for (const match of template.matchAll(EACH_BODY_REF)) {
    const segments = match[1].split(".").filter(Boolean);
    if (segments.length === 0) {
      refs.bodyIsArray = true;
    } else {
      refs.arrayPaths.push(segments);
    }
  }

  return refs;
}

function buildBodySkeleton(refs: TemplateRefs): string | undefined {
  const hasRefs =
    refs.bodyPaths.length > 0 ||
    refs.arrayPaths.length > 0 ||
    refs.hasBareBody ||
    refs.bodyIsArray;
  if (!hasRefs) {
    return undefined;
  }

  const root: BodyNode = { children: new Map(), isArray: refs.bodyIsArray };
  for (const path of refs.bodyPaths) {
    insertPath(root, path, false);
  }
  for (const path of refs.arrayPaths) {
    insertPath(root, path, true);
  }

  const value =
    root.children.size === 0 ? (root.isArray ? [] : {}) : renderNode(root);

  return JSON.stringify(value, null, 2);
}

function insertPath(root: BodyNode, path: string[], isArray: boolean): void {
  let node = root;
  for (const segment of path) {
    let child = node.children.get(segment);
    if (!child) {
      child = { children: new Map(), isArray: false };
      node.children.set(segment, child);
    }
    node = child;
  }

  if (isArray) {
    node.isArray = true;
  }
}

function renderNode(node: BodyNode): unknown {
  if (node.children.size === 0) {
    return node.isArray ? [] : "";
  }

  const value: Record<string, unknown> = {};
  for (const [key, child] of node.children) {
    value[key] = renderNode(child);
  }
  return value;
}

function buildUrl(baseUrl: string, path: string, queryKeys: string[]): string {
  const base = baseUrl.replace(/\/+$/, "");
  const withParams = path.replace(PATH_PARAM, (_, name: string) =>
    name.toUpperCase(),
  );
  const query =
    queryKeys.length > 0
      ? `?${queryKeys.map((key) => `${key}=`).join("&")}`
      : "";

  return `${base}${withParams}${query}`;
}

function resolveHostSource(
  hostName: string | undefined,
  hosts: readonly HostSource[],
): string | undefined {
  if (!hostName) {
    return undefined;
  }

  const host = hosts.find(
    (item) => item.slug === hostName || item.source === hostName,
  );
  return host?.source || hostName;
}

function titleCaseHeader(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("-");
}

function indentContinuationLines(value: string): string {
  return value.split("\n").join("\n  ");
}
