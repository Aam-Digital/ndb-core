declare global {
  function fail(message?: string): never;
  type DoneFn = (error?: unknown) => void;
}

export {};
