"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const LangContext = createContext({ lang: "en", ready: true, toggle: () => {} });
export const useLang = () => useContext(LangContext);

const STORAGE_KEY = "htp_lang";
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "IFRAME"]);
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

// Client-side, DOM-level "auto translate": walks the visible text on the current page, batches the
// unique strings to /api/translate (which caches every English->Bangla pair in the database, so the
// same sentence is only ever machine-translated once, site-wide), then swaps each text node's content
// in place. Reverting to English is instant and lossless - the original text is kept in memory, nothing
// is ever re-fetched from the server to go back. Never runs on /admin - admin content always stays in
// the English the admin actually typed.
export function LangProvider({ children }) {
  const [lang, setLang] = useState("en");
  const [ready, setReady] = useState(true);
  const path = usePathname();
  const originals = useRef(new WeakMap()); // text node -> its original English value
  const genRef = useRef(0); // bumped on every call; a run whose generation is no longer current discards its results instead of applying them
  const debounceId = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "bn") setLang("bn");
    } catch {}
  }, []);

  const isAdmin = path?.startsWith("/admin");

  const runTranslate = useCallback(async (target) => {
    if (isAdmin) return; // admin panel is never translated, regardless of the visitor's saved preference

    // This run "owns" this generation number. The button is never disabled/blocked on a pending
    // translate - clicking again (or a route change) just starts a newer generation, and whenever this
    // older run reaches a checkpoint below and finds it's no longer the current one, it quietly discards
    // whatever it was about to do instead of clobbering what the newer run already applied.
    const myGen = ++genRef.current;
    const stale = () => myGen !== genRef.current;
    setReady(false);

    try {
      if (target === "en") {
        // Instant and local either way - no need to even wait for a stale in-flight "bn" fetch.
        const nodes = collectTextNodes(document.body);
        nodes.forEach((n) => {
          const orig = originals.current.get(n);
          if (orig !== undefined) n.nodeValue = orig;
        });
        return;
      }

      // The whole page, not just <main> - the nav bar, footer, chat widget and every popup/modal
      // (Quick View, Coming soon, free-offer claim, prompt popup, ...) are siblings of <main> in
      // SiteShell, not descendants of it, so scoping to #main silently skipped every one of them.
      const nodes = collectTextNodes(document.body);
      const pairs = nodes.map((n) => {
        if (!originals.current.has(n)) originals.current.set(n, n.nodeValue);
        return { node: n, text: originals.current.get(n) };
      });
      const unique = [...new Set(pairs.map((p) => p.text))];

      // One request for the whole list. Splitting into several parallel requests was tried and reverted:
      // a content-heavy page can have 300+ unique strings, and firing multiple chunks at the free
      // translate endpoint AT ONCE multiplies the concurrent load on it enough that whole chunks started
      // failing outright. The server already rations its own outbound calls (lib/translate.js), so one
      // request here is both simpler and more reliable - just not instant on a big page's first visit.
      const fetchMap = async (list) => {
        if (!list.length) return {};
        try {
          const r = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texts: list, lang: "bn" }) });
          const j = await r.json();
          return j.map || {};
        } catch {
          return {}; // network hiccup - everything is retried in the self-heal pass below
        }
      };

      const map = await fetchMap(unique);
      if (stale()) return;
      for (const { node, text } of pairs) if (map[text]) node.nodeValue = map[text];

      // Self-heal: a string can occasionally come back untranslated even though the rest of its batch
      // succeeded (the free endpoint is flaky under concurrent load, not this app). One retry pass over
      // whatever is still showing its original English closes that gap instead of leaving the page
      // half-translated.
      const leftover = [...new Set(pairs.filter(({ node, text }) => node.nodeValue === text).map((p) => p.text))];
      if (leftover.length) {
        await sleep(500);
        if (stale()) return;
        const retryMap = await fetchMap(leftover);
        if (stale()) return;
        for (const { node, text } of pairs) if (retryMap[text] && retryMap[text] !== text) node.nodeValue = retryMap[text];
      }
    } finally {
      if (!stale()) setReady(true);
    }
  }, [isAdmin]);

  // Re-apply on every route change (client-side navigation swaps #main's content without a full reload).
  useEffect(() => {
    if (isAdmin) return;
    runTranslate(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, path]);

  // Catches content that appears after the fact - modals, popups, client-side filtering - so nothing is
  // missed just because it wasn't in the DOM at the moment the page finished loading.
  useEffect(() => {
    if (isAdmin || lang !== "bn") return undefined;
    const isExcluded = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) return node.closest("[data-no-translate]") != null;
      if (node.nodeType === Node.TEXT_NODE) return node.parentElement?.closest("[data-no-translate]") != null;
      return true;
    };

    const obs = new MutationObserver((mutations) => {
      // A mutation is our own UI reacting to `ready`/`lang` (the toggle button's spinner, or the whole
      // button being added) if either the mutation's parent OR the node(s) it just added sit inside
      // [data-no-translate] - checking the target alone misses the case where the excluded element is
      // itself the thing being freshly inserted (e.g. a whole component remounting), which is exactly
      // what let a translate -> DOM change -> mutation -> translate loop through here before. Reacting to
      // those would never settle, so they're filtered out on either check.
      const meaningful = mutations.some((m) => {
        if (!m.addedNodes.length) return false;
        if (m.target instanceof Element && m.target.closest("[data-no-translate]")) return false;
        return Array.from(m.addedNodes).some((n) => !isExcluded(n));
      });
      if (!meaningful) return;
      clearTimeout(debounceId.current);
      debounceId.current = setTimeout(() => runTranslate("bn"), 150);
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { obs.disconnect(); clearTimeout(debounceId.current); };
  }, [isAdmin, lang, runTranslate]);

  useEffect(() => {
    try { document.documentElement.lang = !isAdmin && lang === "bn" ? "bn" : "en"; } catch {}
  }, [lang, isAdmin]);

  const toggle = () => {
    setLang((l) => {
      const next = l === "en" ? "bn" : "en";
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  };

  return <LangContext.Provider value={{ lang, ready, toggle }}>{children}</LangContext.Provider>;
}
