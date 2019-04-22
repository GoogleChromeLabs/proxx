import { get, set } from "idb-keyval";

const DEFAULT: boolean = true;

/**
 * Set motion preference (true means animation is ON)
 *
 * @param motion
 */
export async function setMotionPreference(motion: boolean): Promise<boolean> {
  set("motion", motion);
  return motion;
}

export async function getMotionPreference(): Promise<boolean> {
  const motion = await get("motion");
  if (typeof motion === "boolean") {
    return motion;
  }
  // if no value is assigned to "motion", return default value
  return DEFAULT;
}
