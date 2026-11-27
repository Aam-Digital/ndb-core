import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Observable } from "rxjs";
import { filter } from "rxjs/operators";
import { DataFilter } from "../../../filter/filters/filters";
import { EntityConstructor } from "../../../entity/model/entity";
import {
  ConditionEditorDialogComponent,
  ConditionEditorDialogData,
} from "../../../common-components/condition-editor-dialog/condition-editor-dialog.component";

/** Options to edit a display condition (or another condition) in the condition editor dialog */
export interface DisplayConditionDialogOptions {
  /** The currently configured condition, if any. */
  condition: DataFilter<any> | null | undefined;

  /** Entity type whose fields can be selected in the condition. */
  entityType: EntityConstructor | undefined;

  /** What the condition applies to, used to describe it to the user. */
  target: "field" | "fieldGroup";

  /** (Optional) Type of the record being edited when the condition is applied, whose fields the condition can compare with. */
  currentRecordType?: EntityConstructor;

  /** (Optional) text replacing the standard explanation of a display condition */
  explanation?: string;
}

/**
 * Opens the condition editor dialog for the display condition of a field or field group in the admin UI.
 */
@Injectable({ providedIn: "root" })
export class DisplayConditionDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Emits the new condition when the editor is saved, or `null` when the condition was removed.
   * Completes without emitting if the editor is cancelled.
   */
  editCondition(
    options: DisplayConditionDialogOptions,
  ): Observable<DataFilter<any> | null> {
    return this.dialog
      .open(ConditionEditorDialogComponent, {
        data: {
          entityConstructor: options.entityType,
          conditions: options.condition,
          explanation:
            options.explanation ??
            (options.target === "fieldGroup"
              ? $localize`This field group is shown only while the record matches...`
              : $localize`This field is shown only while the record matches...`),
          currentRecordType: options.currentRecordType,
        } satisfies ConditionEditorDialogData,
        // comparing with fields of the current record needs an additional column, for long names like "Parent action › Locations"
        width: options.currentRecordType ? "1000px" : "600px",
      })
      .afterClosed()
      .pipe(
        // `undefined` means the dialog was cancelled, leave the condition unchanged
        filter((result) => result !== undefined),
      );
  }
}
