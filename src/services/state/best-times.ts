import { get, set } from "idb-keyval";

function getKey(width: number, height: number, mines: number) {
  // Order width and height, because a 90 degree rotated board is the same thing in terms of
  // difficulty.
  const [size1, size2] = [width, height].sort((a, b) => a - b);
  return `hs:${size1}:${size2}:${mines}`;
}

/**
 * Submit a time. Returns the best time (which will equal `time` if it's a new best time)
 *
 * @param width
 * @param height
 * @param mines
 * @param time
 */
export async function submitTime(
  width: number,
  height: number,
  mines: number,
  time: number
): Promise<number> {
  const key = getKey(width, height, mines);
  const previousBest = await get(key);

  if (typeof previousBest === "number" && time > previousBest) {
    return previousBest;
  }

  // This is technically racy if someone finishes two games at the same time, but… who?
  set(key, time);
  return time;
}

/** Get best time for a given board */
export function getBest(
  width: number,
  height: number,
  mines: number
): Promise<number | undefined> {
  const key = getKey(width, height, mines);
  return get(key);
}
