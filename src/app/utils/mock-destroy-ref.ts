import { DestroyRef } from "@angular/core";

/**
 * A controllable {@link DestroyRef} for use in unit tests.
 *
 * Collects registered `onDestroy` callbacks and lets the test trigger them
 * manually via {@link destroy}, so that DestroyRef-scoped cleanup logic
 * (e.g. `takeUntilDestroyed` or explicit `onDestroy` handlers) can be verified
 * deterministically without a real component lifecycle.
 */
export class MockDestroyRef extends DestroyRef {
  private readonly callbacks = new Set<() => void>();
  private _destroyed = false;

  get destroyed(): boolean {
    return this._destroyed;
  }

  onDestroy(callback: () => void): () => void {
    if (this._destroyed) {
      // mirrors Angular's NG0911 "View has already been destroyed" behavior
      throw new Error("NG0911: View has already been destroyed.");
    }
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /** Trigger all registered onDestroy callbacks, simulating destruction. */
  destroy(): void {
    this._destroyed = true;
    this.callbacks.forEach((cb) => cb());
    this.callbacks.clear();
  }
}
