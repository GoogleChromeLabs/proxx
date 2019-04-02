declare module "chunk-name:*" {
  const value: string;
  export default value;
}

// Stolen from @types/requstidlecallback
declare function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): IdleCallbackHandle;
declare function cancelIdleCallback(handle: IdleCallbackHandle): void;

type IdleCallbackHandle = number;

type IdleRequestCallback = (deadline: IdleDeadline) => void;

interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): DOMHighResTimeStamp;
}

interface IdleRequestOptions {
  timeout: number;
}
