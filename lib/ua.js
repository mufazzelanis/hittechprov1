// Tiny dependency-free user-agent reader: good enough for analytics grouping (device/OS/browser),
// not meant to be a bullet-proof detector for feature gating.
export function parseUA(ua = "") {
  const s = String(ua);
  let device = "desktop";
  if (/iPad/i.test(s) || (/Android/i.test(s) && !/Mobile/i.test(s)) || /Tablet/i.test(s)) device = "tablet";
  else if (/Mobi|iPhone|iPod|Android/i.test(s)) device = "mobile";

  let os = "Other";
  if (/Windows/i.test(s)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(s)) os = "iOS";
  else if (/Mac OS X/i.test(s)) os = "macOS";
  else if (/Android/i.test(s)) os = "Android";
  else if (/CrOS/i.test(s)) os = "ChromeOS";
  else if (/Linux/i.test(s)) os = "Linux";

  let browser = "Other";
  if (/Edg\//i.test(s)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(s)) browser = "Opera";
  else if (/SamsungBrowser/i.test(s)) browser = "Samsung Internet";
  else if (/Chrome\//i.test(s) && !/Edg\/|OPR\//i.test(s)) browser = "Chrome";
  else if (/CriOS/i.test(s)) browser = "Chrome";
  else if (/FxiOS|Firefox\//i.test(s)) browser = "Firefox";
  else if (/Safari\//i.test(s) && !/Chrome\/|Edg\/|OPR\/|CriOS/i.test(s)) browser = "Safari";

  return { device, os, browser };
}
