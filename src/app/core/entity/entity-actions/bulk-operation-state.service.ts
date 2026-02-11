import {
  inject,
  Injectable,
  OnDestroy,
  signal,
  WritableSignal,
} from "@angular/core";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatDialogRef } from "@angular/material/dialog";
import { UpdatedEntity } from "../model/entity-update";
import { Entity } from "../model/entity";
import { filter, take } from "rxjs/operators";

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
  private readonly progressDialogMessage: WritableSignal<string> = signal(
    $localize`:Bulk edit progress message:Preparing bulk action ...`,
  );
  private expectedUpdateCount = 0;
  private processedUpdateCount = 0;
  private expectedUpdateIds: Set<string> | null = null;

  isBulkOperationInProgress$ = this.operationInProgress.asObservable();
  isBulkOperationInProgress(): boolean {
    return this.operationInProgress.value;
  }

  /**
   * Start a bulk operation
   */
  startBulkOperation(expectedCount?: number, expectedEntityIds?: string[]) {
    this.expectedUpdateCount = expectedCount ?? expectedEntityIds?.length ?? 0;
    this.processedUpdateCount = 0;
    this.expectedUpdateIds = expectedEntityIds
      ? new Set(expectedEntityIds)
      : null;
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
    updatedEntity: UpdatedEntity<Entity>,
    autoCompleteBulkOperation?: boolean,
  ): boolean {
    if (!this.operationInProgress.value) {
      return false;
    }

    const shouldCount = this.shouldCountUpdate(updatedEntity);
    if (shouldCount) {
      if (this.expectedUpdateIds) {
        this.expectedUpdateIds.delete(updatedEntity.entity.getId());
      }
      this.processedUpdateCount += 1;
      this.updateProgressDialog();
    }

    if (this.processedUpdateCount >= this.expectedUpdateCount) {
      if (autoCompleteBulkOperation) {
        this.completeBulkOperation();
      }
      return false;
    }

    return true;
  }

  private shouldCountUpdate(updatedEntity: UpdatedEntity<Entity>): boolean {
    if (!this.expectedUpdateIds) {
      return true;
    }

    const id = updatedEntity?.entity?.getId?.();
    return !!id && this.expectedUpdateIds.has(id);
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
    this.expectedUpdateIds = null;
    if (this.progressDialogRef) {
      const dialogRef = this.progressDialogRef;
      dialogRef
        .afterClosed()
        .pipe(take(1))
        .subscribe(() => {
          if (this.progressDialogRef === dialogRef) {
            this.progressDialogRef = null;
          }
        });
      dialogRef.close();
    }
  }

  async waitForBulkOperationToFinish(): Promise<void> {
    if (this.operationInProgress.value) {
      await firstValueFrom(
        this.operationInProgress.pipe(
          filter((inProgress) => !inProgress),
          take(1),
        ),
      );
    }
    if (this.progressDialogRef) {
      await firstValueFrom(this.progressDialogRef.afterClosed().pipe(take(1)));
    }
  }

  ngOnDestroy() {
    if (this.operationInProgress.value) {
      this.completeBulkOperation();
    }

    this.operationInProgress.complete();
  }
}
