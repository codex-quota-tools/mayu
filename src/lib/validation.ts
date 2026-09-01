export function readableError(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function validateWorkBuddyValues(remainingText: string, totalText: string): string | undefined {
  const remaining = Number(remainingText);
  if (!remainingText.trim() || !Number.isFinite(remaining) || remaining < 0) return "请输入有效的非负剩余积分";
  if (!totalText.trim()) return undefined;
  const total = Number(totalText);
  if (!Number.isFinite(total) || total <= 0) return "本期总积分必须大于 0";
  if (total < remaining) return "本期总积分不能小于剩余积分";
  return undefined;
}
