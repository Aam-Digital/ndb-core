import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatMenuModule } from "@angular/material/menu";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

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
    MatCheckboxModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatFormFieldModule,
    FaIconComponent,
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

  subjectLabel(subject: string): string {
    if (subject === "all") {
      return $localize`All record types`;
    }
    if (this.entityRegistry.has(subject)) {
      return this.entityRegistry.get(subject).label ?? subject;
    }
    return subject;
  }

  subjectIcon(subject: string): string | undefined {
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

  addSubject(selected: string | string[]) {
    const subject = Array.isArray(selected) ? selected[0] : selected;
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

  private emitUpdated(mutate: (model: MatrixModel) => void) {
    const updated: MatrixModel = JSON.parse(JSON.stringify(this.model()));
    mutate(updated);
    this.modelChange.emit(updated);
  }
}
