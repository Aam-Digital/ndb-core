import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatTooltipModule } from "@angular/material/tooltip";

import { ConditionsEditorComponent } from "../conditions-editor/conditions-editor.component";
import { DialogCloseComponent } from "../dialog-close/dialog-close.component";
import { EntityConstructor } from "../../entity/model/entity";

export interface ConditionEditorDialogData {
  /** entity type whose fields can be selected in condition rows */
  entityConstructor: EntityConstructor | undefined;

  /** existing condition to edit, if any */
  conditions?: any;

  /** fully localized dialog title shown when an existing condition is being edited */
  editTitle: string;

  /** fully localized dialog title shown when there is no condition yet */
  addTitle: string;

  /** fully localized sentence shown above the conditions editor, explaining what the condition applies to */
  explanation: string;

  /** fully localized hint shown while the "Any" combinator is selected */
  anyHint: string;

  /** fully localized hint shown while the "All" combinator is selected */
  allHint: string;

  /** also offer the internal "_id" field in the field dropdown (e.g. for permission conditions) */
  showInternalIdField?: boolean;
}

/**
 * Generic dialog to visually edit a Mango-query condition build from a list of
 * field/value rows, combined with either "any" ($or) or "all" (merged / $and) semantics.
 *
 * All domain-specific wording (title, explanation, hints) is passed in via {@link ConditionEditorDialogData}
 * so this dialog itself has no knowledge of what the condition is used for
 * (e.g. permissions, or a form field's display condition).
 *
 * Closes with the new condition, `null` to remove it, or `undefined` when cancelled.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-condition-editor-dialog",
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatTooltipModule,
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

  /** whether all rows must match ("all", implicit and / $and) or any row ("any", $or) */
  readonly combinator = signal<"any" | "all">(
    Array.isArray(this.data.conditions?.$or) ? "any" : "all",
  );

  /**
   * Working state in the { $or: [...] } row format of the conditions editor.
   * Deliberately not a signal: the conditions editor mutates this object in place
   * and the template does not need to react to its changes.
   */
  editorConditions: any = toEditorFormat(this.data.conditions);

  readonly combinatorHint = computed(() =>
    this.combinator() === "any" ? this.data.anyHint : this.data.allHint,
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
