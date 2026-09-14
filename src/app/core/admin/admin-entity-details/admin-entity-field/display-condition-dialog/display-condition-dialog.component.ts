import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";

import { ConditionsEditorComponent } from "../../../../common-components/conditions-editor/conditions-editor.component";
import { DialogCloseComponent } from "../../../../common-components/dialog-close/dialog-close.component";
import { EntityConstructor } from "../../../../entity/model/entity";

export interface DisplayConditionDialogData {
  entityType: EntityConstructor;
  displayCondition?: any;
}

/**
 * Dialog to visually edit the condition that determines whether a form field
 * is displayed, based on the values of other fields of the same record.
 *
 * Closes with the new condition, `null` to remove it, or `undefined` when cancelled.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-condition-dialog",
  imports: [
    MatDialogModule,
    MatButtonModule,
    ConditionsEditorComponent,
    DialogCloseComponent,
  ],
  templateUrl: "./display-condition-dialog.component.html",
})
export class DisplayConditionDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<DisplayConditionDialogComponent>,
  );

  readonly data: DisplayConditionDialogData = inject(MAT_DIALOG_DATA);

  readonly hadCondition = !!(
    this.data.displayCondition &&
    Object.keys(this.data.displayCondition).length > 0
  );

  /**
   * Working state in the { $or: [...] } row format of the conditions editor.
   * Deliberately not a signal: the conditions editor mutates this object in place
   * and the template does not need to react to its changes.
   */
  editorConditions: any = structuredClone(this.data.displayCondition ?? {});

  onConditionsChange(conditions: any) {
    this.editorConditions = conditions;
  }

  apply() {
    const hasConditions =
      Array.isArray(this.editorConditions?.$or) &&
      this.editorConditions.$or.length > 0;
    this.dialogRef.close(hasConditions ? this.editorConditions : null);
  }

  removeCondition() {
    this.dialogRef.close(null);
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
