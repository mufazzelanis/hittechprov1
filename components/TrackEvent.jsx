"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// Fires one tracking event when a page opens (e.g. ViewContent on a product page).
export default function TrackEvent({ name, data }) {
  useEffect(() => {
    track(name, data);
  }, []); // eslint-disable-line
  return null;
}
