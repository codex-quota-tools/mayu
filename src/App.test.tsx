import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("quota panel", () => {
  it("shows the weekly headline and the short-term companion window", () => {
    render(<App />);

    expect(screen.getAllByText("39%")).toHaveLength(2);
    expect(screen.getByText("周额度")).toBeTruthy();
    expect(screen.getByText("5 小时额度")).toBeTruthy();
    expect(screen.getByText("71%")).toBeTruthy();
  });

  it("keeps the WorkBuddy editor open when the total is below the remaining value", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "记录积分" }));
    fireEvent.change(screen.getByLabelText("剩余积分"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("本期总积分（可选）"), { target: { value: "50" } });
    fireEvent.submit(screen.getByRole("button", { name: "保存" }).closest("form")!);

    expect(screen.getByRole("alert").textContent).toBe("本期总积分不能小于剩余积分");
    expect(screen.getByRole("heading", { name: "更新 WorkBuddy 积分" })).toBeTruthy();
  });
});
