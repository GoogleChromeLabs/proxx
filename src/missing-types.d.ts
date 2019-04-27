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

declare module "*.glsl" {
  const content: string;
  export default content;
}

interface GA {
  (...args: any[]): void;
  q: any[];
}
declare var ga: GA;
interface Window {
  ga: GA;
}
