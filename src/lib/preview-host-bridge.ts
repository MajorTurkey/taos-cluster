import { isGrokEmbedderOrigin } from "./preview-embedder-origin";

type RouteLike = {
  fullPath?: string;
  children?: RouteLike[];
};

export function collectRoutePathsFromTree(tree: RouteLike | undefined): string[] {
  const out: string[] = [];
  const walk = (node?: RouteLike) => {
    if (!node) return;
    if (node.fullPath) out.push(node.fullPath);
    node.children?.forEach(walk);
  };
  walk(tree);
  return [...new Set(out)];
}

export function installPreviewHostBridge(opts: {
  navigate: (path: string) => void;
  getRoutePaths: () => string[];
}): () => void {
  if (typeof window === "undefined") return () => {};
  const parentOrigin = document.referrer ? (() => {
    try {
      return new URL(document.referrer).origin;
    } catch {
      return "";
    }
  })() : "";
  if (!parentOrigin || !isGrokEmbedderOrigin(parentOrigin)) return () => {};

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== parentOrigin) return;
    const data = event.data as { type?: string; path?: string };
    if (data?.type === "navigate" && typeof data.path === "string") {
      opts.navigate(data.path);
    }
    if (data?.type === "routes?") {
      window.parent.postMessage({ type: "routes", paths: opts.getRoutePaths() }, parentOrigin);
    }
  };
  window.addEventListener("message", onMessage);
  window.parent.postMessage({ type: "ready", paths: opts.getRoutePaths() }, parentOrigin);
  return () => window.removeEventListener("message", onMessage);
}
