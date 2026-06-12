import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Child } from "../domain/types";
import { DataPage } from "./DataPage";
import { ProfilePage } from "./ProfilePage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DataPage", () => {
  it("renders growth, sleep, and vaccine panels", () => {
    render(<DataPage records={[]} />);

    expect(screen.getByText("成长趋势")).toBeInTheDocument();
    expect(screen.getByText("睡眠概览")).toBeInTheDocument();
    expect(screen.getByText("疫苗记录")).toBeInTheDocument();
  });

  it("does not crash when sleep records have invalid dates", () => {
    render(
      <DataPage
        records={[
          {
            id: "sleep-invalid",
            childId: "child-1",
            type: "sleep",
            occurredAt: "2026-06-12T08:00:00.000Z",
            payload: {
              startTime: "not-a-date",
              endTime: "2026-06-12T09:00:00.000Z",
            },
            createdAt: "2026-06-12T08:00:00.000Z",
            updatedAt: "2026-06-12T08:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("睡眠概览")).toBeInTheDocument();
    expect(screen.getByText("0 次")).toBeInTheDocument();
  });
});

describe("ProfilePage", () => {
  const child: Child = {
    id: "child-1",
    name: "小满",
    birthday: "2025-05-20",
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
  };

  it("saves edited child details and exports JSON as a download", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(child);
    const onExport = vi.fn().mockResolvedValue('{"children":[]}');
    Object.defineProperty(globalThis.URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(globalThis.URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    const createObjectUrl = vi.spyOn(globalThis.URL, "createObjectURL").mockReturnValue("blob:backup");
    const revokeObjectUrl = vi.spyOn(globalThis.URL, "revokeObjectURL").mockImplementation(() => undefined);
    const linkClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName, options) => {
      const element = originalCreateElement(tagName, options);

      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          configurable: true,
          value: linkClick,
        });
      }

      return element;
    });

    render(<ProfilePage child={child} onSave={onSave} onExport={onExport} />);

    await user.clear(screen.getByLabelText("昵称"));
    await user.type(screen.getByLabelText("昵称"), "小雨");
    await user.clear(screen.getByLabelText("生日"));
    await user.type(screen.getByLabelText("生日"), "2025-06-01");
    await user.click(screen.getByRole("button", { name: "保存档案" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "小雨", birthday: "2025-06-01" }));

    await user.click(screen.getByRole("button", { name: "导出 JSON" }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(linkClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:backup");
  });

  it("prevents duplicate save calls while saving", async () => {
    const user = userEvent.setup();
    let resolveSave: (value: Child) => void = () => undefined;
    const onSave = vi.fn(
      () =>
        new Promise<Child>((resolve) => {
          resolveSave = resolve;
        }),
    );

    render(<ProfilePage child={child} onSave={onSave} onExport={vi.fn()} />);

    await user.dblClick(screen.getByRole("button", { name: "保存档案" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "保存中..." })).toBeDisabled();

    resolveSave(child);
    expect(await screen.findByText("档案已保存")).toBeInTheDocument();
  });

  it("shows Chinese status messages when save or export fails", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("save failed"));
    const onExport = vi.fn().mockRejectedValue(new Error("export failed"));

    render(<ProfilePage child={child} onSave={onSave} onExport={onExport} />);

    await user.click(screen.getByRole("button", { name: "保存档案" }));
    expect(await screen.findByText("档案保存失败，请稍后再试")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "导出 JSON" }));
    expect(await screen.findByText("JSON 导出失败，请稍后再试")).toBeInTheDocument();
  });

  it("prevents duplicate exports while exporting", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn(() => new Promise<string>(() => undefined));

    render(<ProfilePage child={child} onSave={vi.fn()} onExport={onExport} />);

    await user.dblClick(screen.getByRole("button", { name: "导出 JSON" }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "导出中..." })).toBeDisabled();
  });

  it("revokes object URLs if download click throws", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(child);
    const onExport = vi.fn().mockResolvedValue('{"children":[]}');
    Object.defineProperty(globalThis.URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(globalThis.URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    const createObjectUrl = vi.spyOn(globalThis.URL, "createObjectURL").mockReturnValue("blob:backup");
    const revokeObjectUrl = vi.spyOn(globalThis.URL, "revokeObjectURL").mockImplementation(() => undefined);
    const linkClick = vi.fn(() => {
      throw new Error("download blocked");
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName, options) => {
      const element = originalCreateElement(tagName, options);

      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          configurable: true,
          value: linkClick,
        });
      }

      return element;
    });

    render(<ProfilePage child={child} onSave={onSave} onExport={onExport} />);

    await user.click(screen.getByRole("button", { name: "导出 JSON" }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(linkClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:backup");
    expect(await screen.findByText("JSON 导出失败，请稍后再试")).toBeInTheDocument();
  });
});
