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

  /** fully localized sentence shown above the conditions editor, explaining what the condition applies to */
  explanation: string;

  /** also offer the internal "_id" field in the field dropdown (e.g. for permission conditions) */
  showInternalIdField?: boolean;
}

/**
 * Generic dialog to visually edit a Mango-query condition build from a list of
 * field/value rows, combined with either "any" ($or) or "all" (merged / $and) semantics.
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
    this.combinator() === "any"
      ? $localize`Matches if any one of the conditions applies ("or" conditions).`
      : $localize`Matches only if all conditions apply ("and" conditions).`,
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
 *
 * A condition can combine `$or`/`$and` with sibling keys (Mango's implicit AND,
 * e.g. `{ status: "active", $or: [...] }`). This editor has no concept of nested
 * groups, so such a sibling key cannot be kept ANDed with the `$or`/`$and` array -
 * instead it is folded in as one more row, to at least keep it visible and
 * editable rather than silently dropping it.
 */
function toEditorFormat(condition: any): any {
  if (!condition || typeof condition !== "object") {
    return {};
  }
  const copy = structuredClone(condition);
  const rows: any[] = [];

  if (Array.isArray(copy.$or)) {
    rows.push(...copy.$or);
    delete copy.$or;
  } else if (Array.isArray(copy.$and)) {
    rows.push(...copy.$and);
    delete copy.$and;
  }
  // remaining plain keys (either the whole condition, or siblings of $or/$and above)
  rows.push(...Object.entries(copy).map(([key, value]) => ({ [key]: value })));

  return { $or: rows };
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
