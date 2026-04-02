type FlagValue = boolean | string | number;

export function buildArgs(
  options: Record<string, FlagValue | undefined>,
): string[] {
  const args: string[] = [];
  for (const [flag, value] of Object.entries(options)) {
    if (value === false || value == null) continue;
    if (value === true) {
      args.push(flag);
    } else {
      args.push(flag, String(value));
    }
  }
  return args;
}
