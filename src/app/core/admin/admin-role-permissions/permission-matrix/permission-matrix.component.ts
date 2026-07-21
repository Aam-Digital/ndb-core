import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatMenuModule } from "@angular/material/menu";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { HintBoxComponent } from "../../../common-components/hint-box/hint-box.component";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { EntityTypeSelectComponent } from "../../../entity/entity-type-select/entity-type-select.component";
import {
  PermissionConditionDialogComponent,
  PermissionConditionDialogData,
} from "../condition-dialog/permission-condition-dialog.component";
import { EntityActionPermission } from "../../../permissions/permission-types";
import { MatrixModel, MatrixRow } from "../permission-matrix";

/**
 * Display a role's permission rules as a matrix of
 * record types (rows) and actions (columns).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-permission-matrix",
  imports: [
    NgTemplateOutlet,
    MatTableModule,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatFormFieldModule,
    FaIconComponent,
    FaDynamicIconComponent,
    HintBoxComponent,
    EntityTypeSelectComponent,
  ],
  templateUrl: "./permission-matrix.component.html",
  styleUrl: "./permission-matrix.component.scss",
})
export class PermissionMatrixComponent {
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly dialog = inject(MatDialog);

  readonly model = input.required<MatrixModel>();
  readonly editable = input(false);
  readonly roleName = input("");
  readonly modelChange = output<MatrixModel>();

  readonly crudActions: EntityActionPermission[] = [
    "read",
    "create",
    "update",
    "delete",
  ];
  // rowActions column is always present (empty in view mode)
  // so that column positions do not shift when toggling edit mode
  readonly displayedColumns = [
    "subject",
    "read",
    "create",
    "update",
    "delete",
    "manage",
    "rowActions",
  ];

  /** rows with their subject label, icon and condition support resolved once per model change */
  readonly viewRows = computed(() =>
    this.model().rows.map((row) => ({
      row,
      label: this.subjectLabel(row.subject),
      icon: this.subjectIcon(row.subject),
      conditionsEditable: this.canHaveConditions(row.subject),
    })),
  );

  private subjectLabel(subject: string): string {
    if (subject === "all") {
      return $localize`All record types`;
    }
    if (this.entityRegistry.has(subject)) {
      return this.entityRegistry.get(subject).label ?? subject;
    }
    return subject;
  }

  private subjectIcon(subject: string): string | undefined {
    return this.entityRegistry.has(subject)
      ? this.entityRegistry.get(subject).icon
      : undefined;
  }

  isAllowed(row: MatrixRow, action: EntityActionPermission): boolean {
    return !!(row.cells[action]?.allowed || row.cells.manage?.allowed);
  }

  getConditions(row: MatrixRow, action: EntityActionPermission) {
    return row.cells[action]?.conditions ?? row.cells.manage?.conditions;
  }

  setCellAllowed(
    rowIndex: number,
    action: EntityActionPermission,
    allowed: boolean,
  ) {
    this.emitUpdated((m) => {
      const cells = m.rows[rowIndex].cells;

      if (!allowed && action !== "manage" && cells.manage?.allowed) {
        // downgrade the manage wildcard to explicit permissions for the remaining actions
        delete cells.manage;
        for (const crudAction of this.crudActions) {
          if (crudAction === action) {
            delete cells[crudAction];
          } else {
            cells[crudAction] = { allowed: true };
          }
        }
        return;
      }

      if (allowed) {
        cells[action] = { allowed: true };
      } else {
        delete cells[action];
      }
    });
  }

  setManage(rowIndex: number, checked: boolean) {
    this.setCellAllowed(rowIndex, "manage", checked);
  }

  removeRow(rowIndex: number) {
    this.emitUpdated((m) => m.rows.splice(rowIndex, 1));
  }

  /**
   * Conditions can only be edited visually for entity types
   * that have user-facing fields to define conditions on.
   */
  private canHaveConditions(subject: string): boolean {
    if (subject === "all" || !this.entityRegistry.has(subject)) {
      return false;
    }
    const schema = this.entityRegistry.get(subject).schema;
    return [...schema.values()].some(
      (field) => !field.isInternalField && !!field.label,
    );
  }

  openConditionDialog(rowIndex: number, action: EntityActionPermission) {
    const row = this.model().rows[rowIndex];
    this.dialog
      .open(PermissionConditionDialogComponent, {
        width: "600px",
        data: {
          roleName: this.roleName(),
          action,
          subject: row.subject,
          conditions: row.cells[action]?.conditions,
        } satisfies PermissionConditionDialogData,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === undefined) return;
        this.emitUpdated((m) => {
          m.rows[rowIndex].cells[action] = {
            allowed: true,
            ...(result ? { conditions: result } : {}),
          };
        });
      });
  }

  hasSubject(subject: string): boolean {
    return this.model().rows.some((r) => r.subject === subject);
  }

  /** whether the record-type picker is shown instead of the "Add Permission" button */
  readonly addPickerOpen = signal(false);

  /** re-created after each selection so the add-dropdown resets to empty */
  readonly addSelectVisible = signal(true);

  addSubject(selected: string | string[]) {
    const subject = Array.isArray(selected) ? selected[0] : selected;
    this.addPickerOpen.set(false);
    this.resetAddSelect();
    if (!subject || this.model().rows.some((r) => r.subject === subject)) {
      return;
    }
    // the "all" wildcard row grants full access ({subject: "all", action: "manage"}),
    // new entity rows start with read only
    const cells: MatrixRow["cells"] =
      subject === "all"
        ? { manage: { allowed: true } }
        : { read: { allowed: true } };
    this.emitUpdated((m) => m.rows.push({ subject, cells }));
  }

  private resetAddSelect() {
    this.addSelectVisible.set(false);
    setTimeout(() => this.addSelectVisible.set(true));
  }

  private emitUpdated(mutate: (model: MatrixModel) => void) {
    const updated = structuredClone(this.model());
    mutate(updated);
    this.modelChange.emit(updated);
  }
}
