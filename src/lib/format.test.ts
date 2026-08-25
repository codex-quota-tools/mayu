import { describe, expect, it } from "vitest";
import { clampPercent, formatBeijingDate, formatRelative, freshness, preferredQuotaBucket, quotaWindowLabel, remainingFromUsed } from "./format";

describe("quota formatting", () => {
  it("normalizes remaining percentages", () => {
    expect(remainingFromUsed(25)).toBe(75);
    expect(remainingFromUsed(120)).toBe(0);
    expect(clampPercent(-2)).toBe(0);
  });

  it("formats countdowns without going negative", () => {
    expect(formatRelative(3600, 0)).toBe("1 小时 0 分钟后");
    expect(formatRelative(0, 10_000)).toBe("未提供重置时间");
  });

  it("always formats quota reset time in Beijing time", () => {
    const epoch = Date.parse("2026-08-16T07:02:00Z") / 1000;
    expect(formatBeijingDate(epoch)).toBe("8月16日 15:02");
    expect(formatBeijingDate()).toBe("未提供");
  });

  it("reports stale age", () => {
    expect(freshness(1_000, 1_000_000)).toBe("刚刚更新");
    expect(freshness(1_000, 4_600_000)).toBe("1 小时前更新");
  });

  it("labels common quota windows", () => {
    expect(quotaWindowLabel(300)).toBe("5 小时额度");
    expect(quotaWindowLabel(10_080)).toBe("周额度");
    expect(quotaWindowLabel()).toBe("额度");
  });

  it("selects the longest quota window for the headline", () => {
    const short = { id: "short", windowMinutes: 300 };
    const weekly = { id: "weekly", windowMinutes: 10_080 };
    expect(preferredQuotaBucket([short, weekly])).toBe(weekly);
    expect(preferredQuotaBucket([])).toBeUndefined();
  });
});
