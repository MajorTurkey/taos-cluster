export async function enterClusterDisplay() {
  const root = document.documentElement;
  try {
    if (!document.fullscreenElement && root.requestFullscreen) {
      await root.requestFullscreen({ navigationUI: "hide" } as FullscreenOptions);
    }
  } catch {
    // Fire Chrome may require the gesture; caller already is a tap.
  }
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (mode: string) => Promise<void>;
    };
    await orientation.lock?.("landscape");
  } catch {
    // Kindle often ignores orientation lock.
  }
}

export function isClusterDisplay() {
  return Boolean(
    document.fullscreenElement ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS / some WebViews
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );
}
