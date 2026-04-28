import type { MockDto } from "@/lib/types/mock-dtos";

export const UNLABELED_KEY = "__unlabeled__";

const labelHueCache = new Map<string, number>();

function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function hashStringToHue(str: string): number {
  const normalized = str.toLowerCase().trim();
  const cachedHue = labelHueCache.get(normalized);

  if (cachedHue !== undefined) {
    return cachedHue;
  }

  const hue = cyrb53(normalized) % 360;
  labelHueCache.set(normalized, hue);

  return hue;
}

export function labelStyle(name: string): React.CSSProperties {
  const hue = hashStringToHue(name);
  return {
    backgroundColor: `hsl(${hue} 10% 10%)`,
    color: `hsl(${hue} 90% 70%)`,
    borderColor: `hsl(${hue} 60% 30%)`,
  };
}

export function labelStyleSelected(name: string): React.CSSProperties {
  const hue = hashStringToHue(name);
  return {
    backgroundColor: `hsl(${hue} 90% 60%)`,
    color: "#000000",
    borderColor: `hsl(${hue} 90% 60%)`,
  };
}

export const UNLABELED_STYLE: React.CSSProperties = {
  backgroundColor: "hsl(0 0% 10%)",
  color: "hsl(0 0% 60%)",
  borderColor: "hsl(0 0% 25%)",
};

export const UNLABELED_STYLE_SELECTED: React.CSSProperties = {
  backgroundColor: "hsl(0 0% 60%)",
  color: "#000000",
  borderColor: "hsl(0 0% 60%)",
};

export function getAvailableLabels(mocks: Pick<MockDto, "labels">[]): string[] {
  const normalizedToDisplay = new Map<string, string>();
  const normalizedToCount = new Map<string, number>();

  for (const mock of mocks) {
    for (const label of mock.labels) {
      const normalized = label.toLowerCase();
      if (!normalizedToDisplay.has(normalized)) {
        normalizedToDisplay.set(normalized, label);
      }
      normalizedToCount.set(
        normalized,
        (normalizedToCount.get(normalized) ?? 0) + 1,
      );
    }
  }

  return [...normalizedToDisplay.entries()]
    .sort(([aN, aDisplay], [bN, bDisplay]) => {
      const countDiff =
        (normalizedToCount.get(bN) ?? 0) - (normalizedToCount.get(aN) ?? 0);
      if (countDiff !== 0) return countDiff;
      return aDisplay.length - bDisplay.length;
    })
    .map(([, display]) => display);
}
