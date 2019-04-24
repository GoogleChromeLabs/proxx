import { get, set } from "idb-keyval";
import { GridType } from "../preact-canvas";

const key = "default-game";

export async function setGridDefault(
  width: number,
  height: number,
  mines: number
): Promise<void> {
  await set(key, { width, height, mines });
}

export async function getGridDefault(): Promise<GridType> {
  const gridDefault = await get(key);

  if (!gridDefault) {
    return presets.beginner;
  }

  return gridDefault as GridType;
}

export const presets = {
  advanced: { width: 16, height: 16, mines: 40 },
  beginner: { width: 8, height: 8, mines: 10 },
  expert: { width: 24, height: 24, mines: 99 }
};
