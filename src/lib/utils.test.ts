import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-2", "px-4")).toBe("py-2 px-4");
  });

  it("should handle conditional classes", () => {
    expect(cn("px-2", true && "py-2", false && "bg-red-500")).toBe("px-2 py-2");
  });

  it("should handle object classes", () => {
    expect(cn("px-2", { "py-2": true, "bg-red-500": false })).toBe("px-2 py-2");
  });

  it("should merge conflicting tailwind classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
