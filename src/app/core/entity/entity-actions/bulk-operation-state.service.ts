import {
  inject,
  Injectable,
  OnDestroy,
  signal,
  WritableSignal,
} from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatDialogRef } from "@angular/material/dialog";

/**
 * Service to communicate bulk operation status between edit service and list components
 */
@Injectable({
  providedIn: "root",
})
export class BulkOperationStateService implements OnDestroy {
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  private readonly operationInProgress = new BehaviorSubject<boolean>(false);
  private progressDialogRef: MatDialogRef<any> | null = null;
  private progressDialogMessage: WritableSignal<string> = signal(
    $localize`:Bulk edit progress message:Preparing bulk action ...`,
  );
  private expectedUpdateCount = 0;
  private processedUpdateCount = 0;

  isBulkOperationInProgress$ = this.operationInProgress.asObservable();
  isBulkOperationInProgress(): boolean {
    return this.operationInProgress.value;
  }

  /**
   * Start a bulk operation
   */
  startBulkOperation(expectedCount?: number) {
    this.expectedUpdateCount = expectedCount || 0;
    this.processedUpdateCount = 0;
    this.operationInProgress.next(true);
    this.updateProgressDialog();
    this.progressDialogRef = this.confirmationDialog.showProgressDialog(
      this.progressDialogMessage,
    );
  }

  /**
   * Update bulk operation progress based on received entity updates.
   * Called by list components when they receive entity update events.
   *
   * @return boolean - whether the bulk operation is still in progress
   */
  updateBulkOperationProgress(
    count: number,
    autoCompleteBulkOperation?: boolean,
  ): boolean {
    if (!this.operationInProgress.value) {
      return;
    }

    this.processedUpdateCount += count;
    this.updateProgressDialog();

    if (this.processedUpdateCount >= this.expectedUpdateCount) {
      if (autoCompleteBulkOperation) {
        this.completeBulkOperation();
      }
      return false;
    }

    return true;
  }

  /**
   * Get expected update count
   */
  getExpectedUpdateCount(): number {
    return this.expectedUpdateCount;
  }

  /**
   * Get current processed update count
   */
  getProcessedUpdateCount(): number {
    return this.processedUpdateCount;
  }

  /**
   * Update progress dialog with current progress
   */
  private updateProgressDialog() {
    console.log(
      `BulkOperationStateService: processed ${this.processedUpdateCount} of ${this.expectedUpdateCount} records`,
    );
    this.progressDialogMessage.set(
      $localize`:Bulk edit progress message:Updated ${this.processedUpdateCount} of ${this.expectedUpdateCount} records...`,
    );
  }

  /**
   * Complete a bulk operation.
   *
   * Called automatically, unless there is errors during the bulk operation,
   * in which case the caller should close the operation manually
   */
  completeBulkOperation() {
    this.operationInProgress.next(false);
    this.processedUpdateCount = 0;
    this.expectedUpdateCount = 0;
    if (this.progressDialogRef) {
      this.progressDialogRef.close();
      this.progressDialogRef = null;
    }
  }

  ngOnDestroy() {
    if (this.operationInProgress.value) {
      this.completeBulkOperation();
    }

    this.operationInProgress.complete();
  }
}
