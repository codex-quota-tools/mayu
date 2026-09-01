import { describe, expect, it } from "vitest";
import { readableError, validateWorkBuddyValues } from "./validation";

describe("input validation", () => {
  it("checks WorkBuddy remaining and total values", () => {
    expect(validateWorkBuddyValues("", "")).toBe("请输入有效的非负剩余积分");
    expect(validateWorkBuddyValues("100", "50")).toBe("本期总积分不能小于剩余积分");
    expect(validateWorkBuddyValues("100", "400")).toBeUndefined();
  });

  it("keeps useful native errors and falls back for unknown values", () => {
    expect(readableError("连接失败", "操作失败")).toBe("连接失败");
    expect(readableError(new Error("保存失败"), "操作失败")).toBe("保存失败");
    expect(readableError({}, "操作失败")).toBe("操作失败");
  });
});
