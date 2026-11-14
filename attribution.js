"use strict";
/*
 * URL-only conversion attribution. This script never sends a request,
 * writes a cookie, persists any data, or reads selected files.
 * It preserves only a short, allowlisted promotion source in the URL.
 */
(() => {
  const allowedSources = new Set([
    "cozit", "dreamboat", "ignlab_launch", "seodatapulse",
    "launchingnext", "github", "disquiet", "producthunt",
    "indiehackers", "reddit", "newsletter"
  ]);
  const knownHosts = new Map([
    ["cozit.app", "cozit"],
    ["dreamboat.kr", "dreamboat"],
    ["launch.ignlab.net", "ignlab_launch"],
    ["seodatapulse.com", "seodatapulse"],
    ["launchingnext.com", "launchingnext"],
    ["github.com", "github"],
    ["disquiet.io", "disquiet"],
    ["producthunt.com", "producthunt"],
    ["indiehackers.com", "indiehackers"],
    ["reddit.com", "reddit"]
  ]);
  const normalize = value => {
    const source = String(value || "").trim().toLowerCase();
    return allowedSources.has(source) ? source : "";
  };

  let source = normalize(new URLSearchParams(window.location.search).get("utm_source"));
  if (!source) {
    try {
      const host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, "");
      source = knownHosts.get(host) || "";
    } catch { /* direct visit with no referrer */ }
  }
  if (!source) return;

  document.querySelectorAll("a[href]").forEach(anchor => {
    const original = anchor.getAttribute("href");
    if (!original || original.startsWith("#")) return;
    try {
      const url = new URL(original, window.location.href);
      if (url.origin === window.location.origin && url.pathname === "/check/") {
        url.searchParams.set("utm_source", source);
        url.searchParams.set("utm_medium", "directory");
        url.searchParams.set("utm_campaign", "launch_20261115");
        anchor.href = url.href;
      } else if (
        url.hostname === "www.latpeed.com" &&
        /^\/products\/(?:tej54|sb5ge)\/?$/.test(url.pathname)
      ) {
        url.searchParams.set("utm_source", source);
        url.searchParams.set("utm_medium", "directory");
        url.searchParams.set("utm_campaign", "ai_lab_20261115");
        anchor.href = url.href;
      }
    } catch { /* ignore malformed links */ }
  });
})();
