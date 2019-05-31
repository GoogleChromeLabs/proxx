declare module "consts:nebulaSafeDark" {
  const value: import("./rendering/constants").Color;
  export default value;
}

interface GA {
  (...args: any[]): void;
  q: any[];
}
declare var ga: GA;
interface Window {
  ga: GA;
}

interface HTMLElement {
  webkitRequestFullscreen?: () => void;
}

// tslint:disable-next-line:no-namespace
declare namespace JSX {
  interface HTMLAttributes {
    inputmode?: string;
  }
}
