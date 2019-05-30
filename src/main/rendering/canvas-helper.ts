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

export function roundedRectangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);

  // Top left corner
  ctx.arc(x + radius, y + radius, radius, -Math.PI, -Math.PI / 2, false);

  // Top edge
  ctx.lineTo(x + width - radius, y);

  // Top right corner
  ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0, false);

  // Right edge
  ctx.lineTo(x + width, y + height - radius);

  // Bottom right corner
  ctx.arc(
    x + width - radius,
    y + height - radius,
    radius,
    0,
    Math.PI / 2,
    false
  );

  // Bottom edge
  ctx.lineTo(x + width - radius, y + height);

  // Bottom left corner
  ctx.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI, false);

  ctx.closePath();
}
