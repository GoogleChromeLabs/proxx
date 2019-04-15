declare module "chunk-name:*" {
  const value: string;
  export default value;
}

interface Window {
  debug?: Promise<typeof import("./services/debug/index.js")>;
}

declare module "*.glsl" {
  const content: string;
  export default content;
}

interface Window {
  devicePixelRatioCopy: number;
}
