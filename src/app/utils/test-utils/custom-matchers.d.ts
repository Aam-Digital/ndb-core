import "vitest";

declare module "vitest" {
  interface Assertion<T = any> {
    toContainFormError(error: string): T;
    toHaveValue(formValue: unknown): T;
    toBeValidForm(): T;
    toBeEnabled(): T;
    toHaveKey(key: unknown): T;
    toHaveType(entityType: string): T;
    toEqualArrayWithExactContents(expected: unknown[]): T;
    toBeEmpty(): T;
    toBeFinite(): T;
    toHaveOwnProperty(property: string): T;
    toBeDate(date: number | string | Date): T;
  }

  interface AsymmetricMatchersContaining {
    toContainFormError(error: string): void;
    toHaveValue(formValue: unknown): void;
    toBeValidForm(): void;
    toBeEnabled(): void;
    toHaveKey(key: unknown): void;
    toHaveType(entityType: string): void;
    toEqualArrayWithExactContents(expected: unknown[]): void;
    toBeEmpty(): void;
    toBeFinite(): void;
    toHaveOwnProperty(property: string): void;
    toBeDate(date: number | string | Date): void;
  }
}

declare global {
  function fail(message?: string): never;
  type DoneFn = (error?: unknown) => void;
}
