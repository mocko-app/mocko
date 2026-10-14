import { uuidv5 } from "@/lib/utils/uuid";

export function withSlugDerivedIds<T extends { id?: string; slug: string }>(
  items: T[],
  namespace: string,
): Array<T & { id: string }> {
  const occurrences = new Map<string, number>();
  return items.map((item) => {
    const occurrence = occurrences.get(item.slug) ?? 0;
    occurrences.set(item.slug, occurrence + 1);
    if (item.id) {
      return { ...item, id: item.id };
    }

    const seed = occurrence === 0 ? item.slug : `${item.slug}#${occurrence}`;
    return { ...item, id: uuidv5(seed, namespace) };
  });
}
