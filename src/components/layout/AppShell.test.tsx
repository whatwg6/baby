import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Child } from "../../domain/types";
import { AppShell } from "./AppShell";

const child: Child = {
  id: "child-1",
  name: "小满",
  birthday: "2025-06-12",
  createdAt: "2025-06-12T00:00:00.000Z",
  updatedAt: "2025-06-12T00:00:00.000Z",
};

afterEach(() => {
  cleanup();
});

describe("AppShell", () => {
  it("renders navigation, child summary, and children content", () => {
    render(
      <AppShell activeView="home" onViewChange={vi.fn()} child={child}>
        <p>页面内容</p>
      </AppShell>,
    );

    expect(screen.getByRole("heading", { name: "小满" })).toBeInTheDocument();
    expect(screen.getByText("宝宝成长")).toBeInTheDocument();
    expect(screen.getByText("页面内容")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "首页" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "时间线" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "数据" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "档案" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { current: "page" })).toHaveLength(2);
  });

  it("calls onViewChange from navigation buttons", () => {
    const onViewChange = vi.fn();

    render(
      <AppShell activeView="home" onViewChange={onViewChange} child={child}>
        <p>页面内容</p>
      </AppShell>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "数据" })[0]);

    expect(onViewChange).toHaveBeenCalledWith("data");
  });

  it("handles a missing child without hiding content", () => {
    render(
      <AppShell activeView="profile" onViewChange={vi.fn()} child={null}>
        <p>等待资料</p>
      </AppShell>,
    );

    expect(screen.getByText("等待资料")).toBeInTheDocument();
    expect(screen.getByText("宝宝资料加载中")).toBeInTheDocument();
  });
});
