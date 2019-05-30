import { get, set } from "idb-keyval";

export const supportsVibration = "vibrate" in navigator;

/**
 * Set vibration preference (true means will vibrate)
 *
 * @param vibrate
 */
export async function setVibrationPreference(vibrate: boolean): Promise<void> {
  await set("vibrate", vibrate);
}

export async function getVibrationPreference(): Promise<boolean> {
  const vibrate = await get("vibrate");
  if (typeof vibrate === "boolean") {
    return vibrate;
  }
  // if no value is assigned to "vibrate", return default value
  return supportsVibration;
}
