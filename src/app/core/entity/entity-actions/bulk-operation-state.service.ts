import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs";

interface ProgressDialogRef {
  close(): void;
  componentInstance?: {
    updateMessage?(message: string): void;
  };
}

/**
 * Service to communicate bulk operation status between edit service and list components
 */
@Injectable({
  providedIn: "root",
})
export class BulkOperationStateService implements OnDestroy {
  private bulkOperationState = new BehaviorSubject<boolean>(false);
  private progressDialogRef: ProgressDialogRef | null = null;
  private expectedUpdateCount = 0;

  isBulkOperationInProgress$ = this.bulkOperationState.asObservable();

  /**
   * Start a bulk operation
   */
  startBulkOperation(
    progressDialogRef?: ProgressDialogRef,
    expectedCount?: number,
  ) {
    this.progressDialogRef = progressDialogRef || null;
    this.expectedUpdateCount = expectedCount || 0;
    this.bulkOperationState.next(true);
  }

  /**
   * Get expected update count
   */
  getExpectedUpdateCount(): number {
    return this.expectedUpdateCount;
  }

  /**
   * Update progress dialog with current progress
   */
  updateProgress(current: number, total: number) {
    if (this.progressDialogRef?.componentInstance?.updateMessage) {
      const message = `Updated ${current} of ${total} records...`;
      this.progressDialogRef.componentInstance.updateMessage(message);
    }
  }

  /**
   * Called each time table rendering completes during bulk operation
   */
  onTableRenderingComplete() {
    if (!this.bulkOperationState.value) {
      return;
    }

    this.completeBulkOperation();
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
  }

  /**
   * Get current bulk operation status
   */
  isBulkOperationInProgress(): boolean {
    return this.bulkOperationState.value;
  }

  ngOnDestroy() {
    if (this.bulkOperationState.value) {
      this.completeBulkOperation();
    }

    this.bulkOperationState.complete();
  }
}
