type SlugDefinition = {
  slug: string;
  annotations: readonly string[];
};

function isUiDefinition(item: SlugDefinition): boolean {
  return !item.annotations.includes("READ_ONLY");
}

export function uniqueBySlugPreferringUi<T extends SlugDefinition>(
  items: readonly T[],
): T[] {
  const bySlug = new Map<string, T>();
  for (const item of items) {
    const key = item.slug.toLowerCase();
    const current = bySlug.get(key);
    if (!current || (!isUiDefinition(current) && isUiDefinition(item))) {
      bySlug.set(key, item);
    }
  }
  return [...bySlug.values()];
}

export function findBySlugPreferringUi<T extends SlugDefinition>(
  items: readonly T[],
  slug: string,
): T | undefined {
  const target = slug.toLowerCase();
  return uniqueBySlugPreferringUi(items).find(
    (item) => item.slug.toLowerCase() === target,
  );
}
