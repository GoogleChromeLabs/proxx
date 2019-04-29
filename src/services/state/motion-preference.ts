import { get, set } from "idb-keyval";
import { supportsSufficientWebGL } from "src/rendering/renderer";
import { forceMotionMode } from "../../utils/constants";
import { isFeaturePhone } from "../../utils/static-display";

const DEFAULT: boolean = !matchMedia("(prefers-reduced-motion: reduce)")
  .matches;

/**
 * Set motion preference (true means animation is ON)
 *
 * @param motion
 */
export async function setMotionPreference(motion: boolean): Promise<void> {
  await set("motion", motion);
}

export async function getMotionPreference(): Promise<boolean> {
  const motion = await get("motion");
  if (typeof motion === "boolean") {
    return motion;
  }
  // if no value is assigned to "motion", return default value
  return DEFAULT;
}

export async function shouldUseMotion(): Promise<boolean> {
  // Whenever `motion` query flag is set, it is honoured regardless of device or user preference
  if (forceMotionMode !== undefined) {
    return forceMotionMode;
  }
  if (!supportsSufficientWebGL || isFeaturePhone) {
    return false;
  }
  return getMotionPreference();
}
