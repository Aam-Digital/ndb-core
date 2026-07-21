import {
  ChangeDetectionStrategy,
  Component,
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

import { ConditionsEditorComponent } from "../../../common-components/conditions-editor/conditions-editor.component";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { EntityConstructor } from "../../../entity/model/entity";
import { EntityActionPermission } from "../../../permissions/permission-types";

export interface PermissionConditionDialogData {
  roleName: string;
  action: EntityActionPermission;
  subject: string;
  conditions?: any;
}

/**
 * Dialog to visually edit the conditions restricting one permission
 * (e.g. "user_app can read Children only where center is X").
 *
 * Closes with the new conditions object,
 * null to remove all conditions or undefined when cancelled.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-permission-condition-dialog",
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    ConditionsEditorComponent,
    DialogCloseComponent,
  ],
  templateUrl: "./permission-condition-dialog.component.html",
})
export class PermissionConditionDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<PermissionConditionDialogComponent>,
  );
  private readonly entityRegistry = inject(EntityRegistry);

  readonly data: PermissionConditionDialogData = inject(MAT_DIALOG_DATA);

  readonly entityConstructor: EntityConstructor | undefined =
    this.entityRegistry.has(this.data.subject)
      ? this.entityRegistry.get(this.data.subject)
      : undefined;

  /** whether all rows must match ("all", mongo implicit and) or any row ("any", $or) */
  readonly combinator = signal<"any" | "all">(
    Array.isArray(this.data.conditions?.$or) ? "any" : "all",
  );

  readonly hadConditions = !!this.data.conditions;

  /** working state in the { $or: [...] } row format of the conditions editor */
  editorConditions: any = toEditorFormat(this.data.conditions);

  get entityLabel(): string {
    return this.entityConstructor?.label ?? this.data.subject;
  }

  get combinatorHint(): string {
    return this.combinator() === "any"
      ? $localize`Records match if any one of the conditions applies ("or" conditions).`
      : $localize`Records match only if all conditions apply ("and" conditions).`;
  }

  get actionLabel(): string {
    switch (this.data.action) {
      case "read":
        return $localize`can read`;
      case "create":
        return $localize`can create`;
      case "update":
        return $localize`can update`;
      case "delete":
        return $localize`can delete`;
      case "manage":
        return $localize`can manage`;
    }
  }

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

  removeConditions() {
    this.dialogRef.close(null);
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}

/**
 * Convert any stored conditions shape into the { $or: [...] } row format
 * that the conditions editor works with.
 */
function toEditorFormat(conditions: any): any {
  if (!conditions || typeof conditions !== "object") {
    return {};
  }
  if (Array.isArray(conditions.$or)) {
    return { $or: conditions.$or };
  }
  if (Array.isArray(conditions.$and)) {
    return { $or: conditions.$and };
  }
  // merged plain object: one row per key
  return {
    $or: Object.entries(conditions).map(([key, value]) => ({ [key]: value })),
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
