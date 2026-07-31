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
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { describeConditionFragment } from "../../../common-components/entity-form/dynamic-form-validators/permission-condition-validators";
import { HintBoxComponent } from "../../../common-components/hint-box/hint-box.component";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { EntityTypeSelectComponent } from "../../../entity/entity-type-select/entity-type-select.component";
import {
  PermissionConditionDialogComponent,
  PermissionConditionDialogData,
} from "../condition-dialog/permission-condition-dialog.component";
import { EntityActionPermission } from "../../../permissions/permission-types";
import { MatrixModel, MatrixRow } from "../permission-matrix";
import { DEFAULT_ROLE } from "../role-permissions.service";

/** the four individual CRUD actions shown as their own matrix columns ("manage" is separate) */
type CrudAction = "read" | "create" | "update" | "delete";

/** display state of one action cell */
interface CellState {
  /**
   * allowed by its own rule. Each action (and "manage") is an independent
   * permission, so this does not reflect the broader "manage" wildcard.
   */
  allowed: boolean;
  hasCondition: boolean;
  /** readable summary of the condition, empty when none */
  summary: string;
}

/**
 * Display a role's permission rules as a matrix of
 * record types (rows) and actions (columns).
 * Conditions restricting an action are shown as a readable summary under the record type.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-permission-matrix",
  imports: [
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
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

  /** CRUD columns with their headers baked in, so the template needs no per-cell method call */
  readonly crudColumns: { key: CrudAction; label: string }[] = [
    { key: "read", label: $localize`Read` },
    { key: "create", label: $localize`Create` },
    { key: "update", label: $localize`Update` },
    { key: "delete", label: $localize`Delete` },
  ];
  readonly crudActions: CrudAction[] = this.crudColumns.map((c) => c.key);
  readonly manageColLabel = $localize`Manage (all)`;

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

  /** rows with subject label/icon and per-action cell states resolved once per model change */
  readonly viewRows = computed(() =>
    this.model().rows.map((row) => ({
      row,
      label: this.subjectLabel(row.subject),
      icon: this.subjectIcon(row.subject),
      isInternal: this.isInternalSubject(row.subject),
      conditionsEditable: this.canHaveConditions(row.subject),
      // "manage" grants every action, so the individual actions are shown as
      // covered (checked, not individually editable) when it is set
      manageAllowed: row.subject === "all" || !!row.cells.manage?.allowed,
      actionStates: Object.fromEntries(
        this.crudActions.map((action) => {
          const cell = row.cells[action];
          const state: CellState = {
            allowed: !!cell?.allowed,
            hasCondition: !!cell?.conditions,
            summary: cell?.conditions
              ? this.describeConditions(cell.conditions, row.subject)
              : "",
          };
          return [action, state];
        }),
      ) as Record<CrudAction, CellState>,
    })),
  );

  /** whether the "all" wildcard row is already present (drives the add options) */
  readonly hasAllSubject = computed(() =>
    this.model().rows.some((r) => r.subject === "all"),
  );

  /** the base "_default" role has no fallback to itself, so its empty state differs */
  readonly isDefaultRole = computed(() => this.roleName() === DEFAULT_ROLE);

  /** human-readable summary of a CASL conditions object, e.g. "Center: Alipore and Gender: male" */
  private describeConditions(conditions: any, subject: string): string {
    if (!conditions || typeof conditions !== "object") return "";
    const ctor = this.entityRegistry.has(subject)
      ? this.entityRegistry.get(subject)
      : undefined;
    const fieldLabel = (key: string) => ctor?.schema.get(key)?.label ?? key;
    const describeObject = (obj: any): string =>
      Object.entries(obj)
        .map(
          ([key, value]) =>
            `${fieldLabel(key)}: ${describeConditionFragment(value)}`,
        )
        .join($localize` and `);

    if (Array.isArray(conditions.$or)) {
      return conditions.$or.map(describeObject).join($localize` or `);
    }
    if (Array.isArray(conditions.$and)) {
      return conditions.$and.map(describeObject).join($localize` and `);
    }
    return describeObject(conditions);
  }

  private subjectLabel(subject: string): string {
    if (subject === "all") {
      return $localize`All record types`;
    }
    if (this.entityRegistry.has(subject)) {
      // internal types have no user-facing label; prettify their raw key
      // (e.g. "ConfigurableEnum" -> "Configurable Enum") so it stays readable
      return (
        this.entityRegistry.get(subject).label ?? this.prettifyKey(subject)
      );
    }
    return subject;
  }

  private prettifyKey(key: string): string {
    return key
      .replace(/[_-]+/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();
  }

  private subjectIcon(subject: string): string | undefined {
    return this.entityRegistry.has(subject)
      ? this.entityRegistry.get(subject).icon
      : undefined;
  }

  /**
   * Internal/system entity types are only defined in code to store system data
   * and are not meant for user customization (they carry no user-facing label).
   * They are shown greyed out to signal that permissions on them are advanced.
   */
  private isInternalSubject(subject: string): boolean {
    if (subject === "all" || !this.entityRegistry.has(subject)) {
      return false;
    }
    const type = this.entityRegistry.get(subject);
    return !!type.isInternalEntity || !type.label;
  }

  setCellAllowed(
    rowIndex: number,
    action: EntityActionPermission,
    allowed: boolean,
  ) {
    this.emitUpdated((m) => {
      const cells = m.rows[rowIndex].cells;
      if (allowed) {
        cells[action] = { allowed: true };
      } else {
        delete cells[action];
      }
    });
  }

  /**
   * "Manage (all)" is the CASL wildcard action: it grants every action
   * (including any beyond the four listed). It is a permission of its own,
   * not derived from the individual action checkboxes, so toggling it does
   * not add or remove the individual action rules.
   */
  setManage(rowIndex: number, checked: boolean) {
    this.setCellAllowed(rowIndex, "manage", checked);
  }

  removeRow(rowIndex: number) {
    this.emitUpdated((m) => m.rows.splice(rowIndex, 1));
  }

  /** clear the condition of an action, keeping the action itself allowed */
  removeCondition(rowIndex: number, action: EntityActionPermission) {
    this.emitUpdated((m) => {
      const cell = m.rows[rowIndex].cells[action];
      if (cell) delete cell.conditions;
    });
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
        // the dialog only returns a real result on Apply (a conditions object)
        // or "Remove condition" (null); cancelling / closing (undefined or the
        // shared close button's empty string) must leave the cell untouched
        if (result !== null && typeof result !== "object") return;
        this.emitUpdated((m) => {
          // keep any unmodelled properties (e.g. reason) that the cell carried
          const extra = m.rows[rowIndex].cells[action]?.extra;
          m.rows[rowIndex].cells[action] = {
            allowed: true,
            ...(result ? { conditions: result } : {}),
            ...(extra ? { extra } : {}),
          };
        });
      });
  }

  /** whether the record-type picker is shown instead of the "Add Permission" button */
  readonly addPickerOpen = signal(false);

  /**
   * Toggled off-then-on after each selection to force Angular to destroy and
   * re-create the record-type dropdown. `app-entity-type-select` keeps its
   * chosen value in internal state that rebinding `[value]` does not clear,
   * so a remount is the reliable way to reset it to empty for the next add.
   */
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
