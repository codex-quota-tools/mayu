export const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export const remainingFromUsed = (used: number) => clampPercent(100 - used);

export function formatDate(epochSeconds?: number): string {
  if (!epochSeconds) return "未提供";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(new Date(epochSeconds * 1000));
}

export function formatBeijingDate(epochSeconds?: number): string {
  if (!epochSeconds) return "未提供";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date(epochSeconds * 1000));
}

export function formatRelative(epochSeconds?: number, now = Date.now()): string {
  if (!epochSeconds) return "未提供重置时间";
  const delta = Math.max(0, epochSeconds * 1000 - now);
  const totalMinutes = Math.floor(delta / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days) return `${days} 天 ${hours} 小时后`;
  if (hours) return `${hours} 小时 ${minutes} 分钟后`;
  return `${minutes} 分钟后`;
}

export function freshness(updatedAt?: number, now = Date.now()): string {
  if (!updatedAt) return "尚未更新";
  const minutes = Math.floor((now - updatedAt * 1000) / 60000);
  if (minutes < 1) return "刚刚更新";
  if (minutes < 60) return `${minutes} 分钟前更新`;
  return `${Math.floor(minutes / 60)} 小时前更新`;
}
