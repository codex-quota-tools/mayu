import { render, screen } from "@testing-library/react";
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
});
