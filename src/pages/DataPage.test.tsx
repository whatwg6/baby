import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Child } from "../domain/types";
import { DataPage } from "./DataPage";
import { ProfilePage } from "./ProfilePage";

describe("DataPage", () => {
  it("renders growth, sleep, and vaccine panels", () => {
    render(<DataPage records={[]} />);

    expect(screen.getByText("成长趋势")).toBeInTheDocument();
    expect(screen.getByText("睡眠概览")).toBeInTheDocument();
    expect(screen.getByText("疫苗记录")).toBeInTheDocument();
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
});
