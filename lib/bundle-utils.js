import path from "path";

export function getCodeAndDependencies(bundle, name) {
  const chunk = findChunkWithName(bundle, name);
  const output = [];
  const crawlDependencies = new Set([chunk.fileName]);

  for (const fileName of crawlDependencies) {
    const chunk = bundle[fileName];
    output.push(chunk.code);
    for (const dep of chunk.imports) {
      crawlDependencies.add(dep);
    }
  }

  return output.join("\n");
}

export function findChunkWithName(bundle, name) {
  return Object.values(bundle).find(desc =>
    (desc.facadeModuleId || "").endsWith(name)
  );
}

export function findAssetWithName(bundle, name) {
  const parsedName = path.parse(name);

  return Object.values(bundle).find(desc => {
    if (!desc.isAsset) return false;
    const parsedGraphName = path.parse(desc.fileName);
    if (parsedGraphName.ext !== parsedName.ext) return false;
    if (!parsedGraphName.name.startsWith(parsedName.name)) return false;
    const expectedHash = parsedGraphName.name.slice(parsedName.name.length);
    return /^-[0-9a-f]+$/.test(expectedHash);
  });
}
