import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";

import { ConditionsEditorComponent } from "../conditions-editor/conditions-editor.component";
import { normalizeConditions } from "../conditions-editor/conditions-combinator";
import { DialogCloseComponent } from "../dialog-close/dialog-close.component";
import { EntityConstructor } from "../../entity/model/entity";

export interface ConditionEditorDialogData {
  /** entity type whose fields can be selected in condition rows */
  entityConstructor: EntityConstructor | undefined;

  /** existing condition to edit, if any */
  conditions?: any;

  /** fully localized sentence shown above the conditions editor, explaining what the condition applies to */
  explanation: string;

  /** also offer the internal "_id" field in the field dropdown (e.g. for permission conditions) */
  showInternalIdField?: boolean;
}

/**
 * Dialog around the {@link ConditionsEditorComponent}: it says what the condition applies to and
 * hands back the edited Mango-query condition.
 *
 * Configured via {@link ConditionEditorDialogData}
 *
 * Closes with the new condition, `null` to remove it, or `undefined` when cancelled.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-condition-editor-dialog",
  imports: [
    MatDialogModule,
    MatButtonModule,
    ConditionsEditorComponent,
    DialogCloseComponent,
  ],
  templateUrl: "./condition-editor-dialog.component.html",
})
export class ConditionEditorDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<ConditionEditorDialogComponent>,
  );

  readonly data: ConditionEditorDialogData = inject(MAT_DIALOG_DATA);

  readonly hadCondition = !!(
    this.data.conditions && Object.keys(this.data.conditions).length > 0
  );

  /** the condition as the editor last reported it, initially the existing one */
  private conditions: any = normalizeConditions(this.data.conditions);

  onConditionsChange(conditions: any) {
    this.conditions = conditions;
  }

  apply() {
    this.dialogRef.close(
      Object.keys(this.conditions).length > 0 ? this.conditions : null,
    );
  }

  removeCondition() {
    this.dialogRef.close(null);
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
