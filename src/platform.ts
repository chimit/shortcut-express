import { isTauri } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";

export type LessonPlatform = "macos" | "windows" | "linux";

export const platforms: { id: LessonPlatform; label: string }[] = [
  { id: "macos", label: "macOS" },
  { id: "windows", label: "Windows" },
  { id: "linux", label: "Linux" },
];

const detectedPlatform = isTauri()
  ? platform()
  : navigator.userAgent.includes("Windows")
    ? "windows"
    : navigator.userAgent.includes("Linux")
      ? "linux"
      : "macos";

// Detection never locks the learner in: the header can switch to any platform.
export const initialPlatform: LessonPlatform =
  detectedPlatform === "windows" || detectedPlatform === "linux" ? detectedPlatform : "macos";
