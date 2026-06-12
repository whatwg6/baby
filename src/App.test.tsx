import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the baby growth landing shell", () => {
    render(<App />);

    expect(screen.getByText("成长记录")).toBeInTheDocument();
    expect(screen.getByText("宝宝成长记录")).toBeInTheDocument();
  });
});
