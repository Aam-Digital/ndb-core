import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";

import { ConditionsEditorComponent } from "../../../../common-components/conditions-editor/conditions-editor.component";
import {
  ConditionCombinator,
  ConditionCombinatorToggleComponent,
} from "../../../../common-components/condition-combinator-toggle/condition-combinator-toggle.component";
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
    ConditionCombinatorToggleComponent,
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

  /** whether all rows must match ("all", implicit and / $and) or any row ("any", $or) */
  readonly combinator = signal<ConditionCombinator>(
    Array.isArray(this.data.displayCondition?.$or) ? "any" : "all",
  );

  /**
   * Working state in the { $or: [...] } row format of the conditions editor.
   * Deliberately not a signal: the conditions editor mutates this object in place
   * and the template does not need to react to its changes.
   */
  editorConditions: any = toEditorFormat(this.data.displayCondition);

  readonly combinatorHint = computed(() =>
    this.combinator() === "any"
      ? $localize`The field is shown if any one of the conditions below applies.`
      : $localize`The field is shown only if every one of the conditions below applies.`,
  );

  onConditionsChange(conditions: any) {
    this.editorConditions = conditions;
  }

  apply() {
    const rows: any[] = (this.editorConditions?.$or ?? []).filter(
      (row: any) =>
        row &&
        typeof row === "object" &&
        Object.keys(row).length > 0 &&
        Object.values(row).every((v) => v !== null && v !== undefined),
    );

    if (rows.length === 0) {
      this.dialogRef.close(null);
    } else if (this.combinator() === "any") {
      this.dialogRef.close({ $or: rows });
    } else {
      this.dialogRef.close(mergeToAllConditions(rows));
    }
  }

  removeCondition() {
    this.dialogRef.close(null);
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}

/**
 * Convert any stored condition shape into the { $or: [...] } row format
 * that the conditions editor works with.
 *
 * Deep-copies the input so the editor (which mutates rows in place) cannot
 * touch the caller's config: cancelling the dialog must leave it untouched.
 */
function toEditorFormat(condition: any): any {
  if (!condition || typeof condition !== "object") {
    return {};
  }
  const copy = structuredClone(condition);
  if (Array.isArray(copy.$or)) {
    return { $or: copy.$or };
  }
  if (Array.isArray(copy.$and)) {
    return { $or: copy.$and };
  }
  // merged plain object: one row per key
  return {
    $or: Object.entries(copy).map(([key, value]) => ({ [key]: value })),
  };
}

/**
 * Combine rows into "all must match" conditions:
 * a single merged object if keys are unique, otherwise an explicit $and.
 */
function mergeToAllConditions(rows: any[]): any {
  const keys = rows.flatMap((row) => Object.keys(row));
  if (new Set(keys).size === keys.length) {
    return Object.assign({}, ...rows);
  }
  return { $and: rows };
}
