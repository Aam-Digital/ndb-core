import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from "@angular/core";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTableModule } from "@angular/material/table";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

import { HintBoxComponent } from "../../../common-components/hint-box/hint-box.component";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
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
    MatTableModule,
    MatCheckboxModule,
    FaIconComponent,
    HintBoxComponent,
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
  readonly displayedColumns = [
    "subject",
    "read",
    "create",
    "update",
    "delete",
    "manage",
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
}
