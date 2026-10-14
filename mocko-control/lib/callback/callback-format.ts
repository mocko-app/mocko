type CallbackTarget = {
  host?: string;
  path?: string;
  url?: string;
};

export function formatCountdown(msLeft: number): string {
  if (msLeft <= 0) {
    return "due now";
  }

  const seconds = Math.ceil(msLeft / 1000);
  if (seconds < 60) {
    return `in ${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `in ${minutes}m ${seconds % 60}s`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `in ${hours}h ${minutes % 60}m`;
  }

  const days = Math.floor(hours / 24);
  return `in ${days}d ${hours % 24}h`;
}

export function formatHeldAgo(msSinceHeld: number): string {
  const seconds = Math.floor(Math.max(msSinceHeld, 0) / 1000);
  if (seconds < 1) {
    return "held just now";
  }
  if (seconds < 60) {
    return `held ${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `held ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `held ${hours}h ago`;
  }

  return `held ${Math.floor(hours / 24)}d ago`;
}

export function targetLabel(target: CallbackTarget): string {
  if (target.url) {
    return target.url;
  }

  return `@${target.host} ${target.path}`;
}
