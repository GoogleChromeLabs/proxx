declare module "chunk-name:*" {
  const value: string;
  export default value;
}

declare module "resource-list:" {
  const value: string[];
  export default value;
}

declare module "consts:version" {
  const value: string;
  export default value;
}

declare module "*.glsl" {
  const content: string;
  export default content;
}
