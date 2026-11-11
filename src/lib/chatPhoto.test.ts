import { describe, expect, it } from "vitest";
import { photoError } from "./chatPhoto";
import { isChatPhoto } from "../../supabase/functions/support-chat/photos";

describe("chat photos", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", type => {
    expect(photoError({ type, size: 100 })).toBeNull();
  });
  it("rejects other formats", () => {
    expect(photoError({ type: "image/gif", size: 100 })).toBe("type");
    expect(photoError({ type: "image/svg+xml", size: 100 })).toBe("type");
  });
  it("enforces the 5MB limit", () => {
    expect(photoError({ type: "image/png", size: 5 * 1024 * 1024 })).toBeNull();
    expect(photoError({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).toBe("size");
  });
  it("accepts image bytes, not a file name or remote URL", () => {
    expect(isChatPhoto("data:image/png;base64," + btoa("\x89PNG\r\n\x1a\n"), "image/png")).toBe(true);
    expect(isChatPhoto("photo.png", "image/png")).toBe(false);
    expect(isChatPhoto("https://example.com/photo.png", "image/png")).toBe(false);
    expect(isChatPhoto("data:image/png;base64," + btoa("not a png"), "image/png")).toBe(false);
  });
});