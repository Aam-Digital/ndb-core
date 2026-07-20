import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatMenuModule } from "@angular/material/menu";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

import { HintBoxComponent } from "../../../common-components/hint-box/hint-box.component";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { EntityTypeSelectComponent } from "../../../entity/entity-type-select/entity-type-select.component";
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

  readonly model = input.required<MatrixModel>();
  readonly editable = input(false);
  readonly modelChange = output<MatrixModel>();

  readonly crudActions: EntityActionPermission[] = [
    "read",
    "create",
    "update",
    "delete",
  ];
  readonly displayedColumns = computed(() => [
    "subject",
    "read",
    "create",
    "update",
    "delete",
    "manage",
    ...(this.editable() ? ["rowActions"] : []),
  ]);

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
      if (allowed) {
        m.rows[rowIndex].cells[action] = { allowed: true };
      } else {
        delete m.rows[rowIndex].cells[action];
      }
    });
  }

  setManage(rowIndex: number, checked: boolean) {
    this.setCellAllowed(rowIndex, "manage", checked);
  }

  removeRow(rowIndex: number) {
    this.emitUpdated((m) => m.rows.splice(rowIndex, 1));
  }

  addSubject(selected: string | string[]) {
    const subject = Array.isArray(selected) ? selected[0] : selected;
    if (!subject || this.model().rows.some((r) => r.subject === subject)) {
      return;
    }
    this.emitUpdated((m) =>
      m.rows.push({ subject, cells: { read: { allowed: true } } }),
    );
  }

  private emitUpdated(mutate: (model: MatrixModel) => void) {
    const updated: MatrixModel = JSON.parse(JSON.stringify(this.model()));
    mutate(updated);
    this.modelChange.emit(updated);
  }
}
