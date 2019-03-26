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
import DtsCreator from "typed-css-modules";
import find from "find";

function newCreator() {
  return new DtsCreator({
    camelCase: true
  });
}

async function writeTypes(file, creator = newCreator()) {
  const content = await creator.create(file);
  await content.writeFile();
}

export default function cssModuleTypes(root) {
  return {
    name: "css-module-types",
    async buildStart() {
      const creator = newCreator();

      const files = await new Promise(resolve => {
        find.file(/\.css$/, root, resolve);
      });

      const promises = files.map(async file => {
        this.addWatchFile(file);
        await writeTypes(file, creator);
      });

      await Promise.all(promises);
    },
    async watchChange(id) {
      if (!id.endsWith(".css")) {
        return null;
      }
      await writeTypes(id);
    }
  };
}
