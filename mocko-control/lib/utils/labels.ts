import type { MockDto } from "@/lib/types/mock-dtos";

export const UNLABELED_KEY = "__unlabeled__";

function hashStringToHue(str: string): number {
  const normalized = str.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
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
