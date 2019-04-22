declare module "chunk-name:*" {
  const value: string;
  export default value;
}

declare module "resource-list:" {
  const value: string[];
  export default value;
}

declare module "consts:" {
  export const version: string;
}

interface Window {
  debug?: Promise<typeof import("./services/debug/index.js")>;
}

declare module "*.glsl" {
  const content: string;
  export default content;
}
