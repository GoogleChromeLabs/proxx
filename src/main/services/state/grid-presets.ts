/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// WARNING: This module is part of the main bundle. Avoid adding to it if possible.

export const presets = {
  easy: { width: 8, height: 8, mines: 10 },
  medium: { width: 16, height: 16, mines: 40 },
  hard: { width: 24, height: 24, mines: 99 }
};

export type PresetName = keyof typeof presets;

export function getPresetName(
  width: number,
  height: number,
  mines: number
): PresetName | "custom" {
  for (const [presetName, preset] of Object.entries(presets)) {
    if (
      width === preset.width &&
      height === preset.height &&
      mines === preset.mines
    ) {
      return presetName as PresetName;
    }
  }

  return "custom";
}
