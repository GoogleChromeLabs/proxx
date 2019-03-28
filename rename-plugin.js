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

import * as fs from "fs";
import * as path from "path";

const defaultOpts = {
  prefix: "rename"
};

export default function rename(opts) {
  opts = Object.assign({}, defaultOpts, opts);
  const prefix = opts.prefix + ":";

  const symlinks = new Set();
  return {
    name: "rename",
    async resolveId(id, importer) {
      if (!id.startsWith(prefix)) {
        return;
      }
      let newname = id.split(":", 3)[1];
      let oldname = id.split(":", 3)[2];
      id = await this.resolveId(oldname, importer);
      const ext = path.extname(id);

      newname = newname + ext;
      const copy = path.join(path.dirname(id), newname);
      try {
        fs.statSync(copy);
      } catch (e) {
        fs.symlinkSync(id, copy);
      }
      symlinks.add(copy);
      return copy;
    },
    writeBundle() {
      symlinks.forEach(symlink => fs.unlinkSync(symlink));
    }
  };
}
