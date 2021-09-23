import { Injectable } from "@angular/core";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { EntityMapperService } from "./entity-mapper.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Entity } from "./model/entity";
import { Observable, Subject } from "rxjs";

export enum RemoveResult {
  CANCELLED,
  REMOVED,
  UNDONE,
}

@Injectable({
  providedIn: "root",
})
export class EntityRemoveService {
  constructor(
    private confirmationDialog: ConfirmationDialogService,
    private entityMapper: EntityMapperService,
    private snackBar: MatSnackBar
  ) {}

  remove(entity: Entity): Observable<RemoveResult> {
    const subject = new Subject<RemoveResult>();
    const dialogRef = this.confirmationDialog.openDialog(
      $localize`:Delete confirmation title:Delete?`,
      $localize`:Delete confirmation text:Are you sure you want to delete this ${entity} ?`
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.entityMapper
          .remove(entity)
          .then(() => subject.next(RemoveResult.REMOVED));
        const snackBarRef = this.snackBar.open(
          $localize`:Deleted Entity information:Deleted Entity ${entity.toString()}`,
          "Undo",
          { duration: 8000 }
        );
        snackBarRef.onAction().subscribe(() => {
          this.entityMapper.save(entity, true).then(() => {
            subject.next(RemoveResult.UNDONE);
            subject.complete();
          });
        });
        snackBarRef.afterDismissed().subscribe(() => {
          subject.complete();
        });
      } else {
        subject.next(RemoveResult.CANCELLED);
      }
    });
    return subject.asObservable();
  }
}
