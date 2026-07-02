import { Injectable, Signal, computed, inject, signal } from "@angular/core";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";

/**
 * This service handles the state whether there are currently some unsaved changes in the app.
 * These pending changes might come from a form component or popup.
 * If there are pending changes, certain actions in the app should trigger a user confirmation if the changes should be discarded.
 *
 * Changes are tracked per "source" (e.g. an individual form or component) so that multiple layers
 * of unsaved changes can coexist (e.g. a dirty main view with a dirty dialog form opened on top of it).
 * Each source is responsible for registering and clearing its own state
 * (usually tied to its lifecycle via `DestroyRef`).
 */
@Injectable({
  providedIn: "root",
})
export class UnsavedChangesService {
  private confirmation = inject(ConfirmationDialogService);

  /** the set of sources (forms, components, ...) that currently have unsaved changes */
  private readonly sources = signal(new Set<object>());

  /**
   * Whether the user has any pending changes that are not yet saved.
   */
  readonly pending: Signal<boolean> = computed(() => this.sources().size > 0);

  constructor() {
    // prevent browser navigation if changes are pending
    window.onbeforeunload = (e) => {
      if (this.pending()) {
        e.preventDefault();
        e.returnValue = "onbeforeunload";
      }
    };
  }

  /**
   * Register or clear the unsaved-changes state for a specific source.
   *
   * A source can be any stable object identity (e.g. an `EntityForm` or a component instance).
   * Sources should clear their state when destroyed (e.g. via `DestroyRef.onDestroy`).
   *
   * @param source the object identifying the origin of the changes
   * @param hasChanges whether this source currently has unsaved changes
   */
  setUnsavedChanges(source: object, hasChanges: boolean) {
    const current = this.sources();
    if (hasChanges === current.has(source)) {
      // no change - avoid needless signal updates
      return;
    }
    const next = new Set(current);
    if (hasChanges) {
      next.add(source);
    } else {
      next.delete(source);
    }
    this.sources.set(next);
  }

  /**
   * Shows a user confirmation popup if there are unsaved changes which will be discarded.
   *
   * @param source if given, only this source's changes are considered (and discarded on confirm),
   *   e.g. when closing a single dialog. If omitted, all sources are considered (and discarded on
   *   confirm), e.g. when navigating away from the whole view.
   * @returns whether it is safe to proceed (no changes, or the user confirmed discarding them)
   */
  async checkUnsavedChanges(source?: object): Promise<boolean> {
    const hasChanges = source ? this.sources().has(source) : this.pending();
    if (!hasChanges) {
      return true;
    }

    const confirmed = !!(await this.confirmation.getDiscardConfirmation());
    if (confirmed) {
      if (source) {
        this.setUnsavedChanges(source, false);
      } else {
        this.sources.set(new Set());
      }
    }
    return confirmed;
  }
}
