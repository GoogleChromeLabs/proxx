import { get, set } from "idb-keyval";

const DEFAULT = true;

export async function setHighlights(pref: boolean) {
  await set("highlights", pref);
}

export async function getHighlights() {
  const highlights = await get("highlights");
  if (typeof highlights === "boolean") {
    return highlights;
  }
  return DEFAULT;
}
