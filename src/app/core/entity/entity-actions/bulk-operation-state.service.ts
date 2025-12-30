import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs";

/**
 * Service to get bulk operation status between bulk action services and entity-list component
 */
@Injectable({
  providedIn: "root",
})
export class BulkOperationStateService implements OnDestroy {
  private readonly bulkOperationState = new BehaviorSubject<boolean>(false);
  private progressDialogRef: any = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_DELAY = 2000;

  isBulkOperationInProgress$ = this.bulkOperationState.asObservable();

  /**
   * Start a bulk operation
   */
  startBulkOperation(progressDialogRef?: any) {
    this.progressDialogRef = progressDialogRef;
    this.bulkOperationState.next(true);
  }

  /**
   * Called each time table rendering completes during bulk operation
   */
  onTableRenderingComplete() {
    if (!this.bulkOperationState.value) {
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer - only complete operation if no more updates for DEBOUNCE_DELAY
    this.debounceTimer = setTimeout(() => {
      this.completeBulkOperation();
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Complete a bulk operation
   */
  private completeBulkOperation() {
    this.bulkOperationState.next(false);
    if (this.progressDialogRef) {
      this.progressDialogRef.close();
      this.progressDialogRef = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Get current bulk operation status
   */
  isBulkOperationInProgress(): boolean {
    return this.bulkOperationState.value;
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
