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

import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { describeConditionFragment } from "../../../common-components/entity-form/dynamic-form-validators/permission-condition-validators";
import { HintBoxComponent } from "../../../common-components/hint-box/hint-box.component";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { EntityTypeSelectComponent } from "../../../entity/entity-type-select/entity-type-select.component";
import {
  PermissionConditionDialogComponent,
  PermissionConditionDialogData,
} from "../condition-dialog/permission-condition-dialog.component";
import {
  DatabaseRule,
  DEFAULT_SECTION_KEY,
  EntityActionPermission,
} from "../../../permissions/permission-types";
import { MatrixModel, MatrixRow } from "../permission-matrix";

/** the four individual CRUD actions shown as their own matrix columns ("manage" is separate) */
type CrudAction = "read" | "create" | "update" | "delete";

/**
 * Where an action is granted from, if not by an own rule of its row:
 * the row's own "manage", the "all record types" row of this same role,
 * or the shared "_default" role that applies to every logged-in user.
 */
type GrantedBy = "manage" | "wildcard" | "default";

/** display state of one action cell */
interface CellState {
  /** shown as granted, either by an own rule of this row or by a broader one */
  allowed: boolean;
  /** granted by an own rule of this row, so a condition can be attached to it */
  ownAllowed: boolean;
  /** whether the checkbox may be changed on this row */
  editable: boolean;
  hasCondition: boolean;
  /** readable summary of the condition, empty when none */
  summary: string;
  /** why the checkbox cannot be changed; empty when it is editable */
  lockTooltip: string;
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
  private readonly confirmation = inject(ConfirmationDialogService);

  readonly model = input.required<MatrixModel>();
  readonly editable = input(false);
  readonly roleName = input("");

  /**
   * Rules of the shared "_default" role, which apply to every logged-in user on
   * top of their own roles. Shown as already granted here, because revoking them
   * for a single role would require an inverted rule.
   */
  readonly inheritedRules = input<DatabaseRule[]>([]);
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

  /** the "all record types" row of this role, which grants its actions for every type */
  private readonly wildcardRow = computed(() =>
    this.model().rows.find((row) => row.subject === "all"),
  );

  /**
   * rows with subject label/icon and per-action cell states, resolved once per
   * model change. The shared "_default" role is prepended as a read-only row,
   * so it is visible what every logged-in user may do on top of this role.
   */
  readonly viewRows = computed(() => {
    const rows = this.model().rows.map((row, modelIndex) =>
      this.toViewRow(row, modelIndex),
    );
    const defaultRow = this.defaultViewRow();
    return defaultRow ? [defaultRow, ...rows] : rows;
  });

  private toViewRow(row: MatrixRow, modelIndex: number) {
    // "manage" grants every action, so the individual actions are shown as
    // covered (checked, not individually editable) when it is set
    const manageAllowed = !!row.cells.manage?.allowed;
    return {
      row,
      /** index in the edited model; -1 for the read-only "Default" row */
      modelIndex,
      isDefaultRow: false,
      label: this.subjectLabel(row.subject),
      icon: this.subjectIcon(row.subject),
      isInternal: this.isInternalSubject(row.subject),
      conditionsEditable: this.canHaveConditions(row.subject),
      manageAllowed,
      manageState: this.cellState(row, "manage", manageAllowed),
      actionStates: Object.fromEntries(
        this.crudActions.map((action) => [
          action,
          this.cellState(row, action, manageAllowed),
        ]),
      ) as Record<CrudAction, CellState>,
    };
  }

  /**
   * The shared "_default" role as a read-only row, listing what it grants for
   * every record type. Absent while editing that role itself and when it grants
   * nothing across all record types.
   */
  private readonly defaultViewRow = computed(() => {
    if (this.isDefaultRole()) {
      return undefined;
    }

    // only what the default role grants for every record type is shown here;
    // grants for a single type lock that type's row instead
    const cells: MatrixRow["cells"] = {};
    for (const action of [...this.crudActions, "manage" as const]) {
      if (this.inheritedGrantsForAllTypes(action)) {
        cells[action] = { allowed: true };
      }
    }
    if (Object.keys(cells).length === 0) {
      // nothing granted to everyone, so the row would only add noise
      return undefined;
    }

    const row: MatrixRow = { subject: DEFAULT_SECTION_KEY, cells };
    const manageAllowed = !!cells.manage?.allowed;
    return {
      row,
      modelIndex: -1,
      isDefaultRow: true,
      label: $localize`:Default permissions row label:Default`,
      icon: undefined,
      isInternal: false,
      conditionsEditable: false,
      manageAllowed,
      manageState: this.defaultRowCellState(!!cells.manage?.allowed),
      actionStates: Object.fromEntries(
        this.crudActions.map((action) => [
          action,
          this.defaultRowCellState(manageAllowed || !!cells[action]?.allowed),
        ]),
      ) as Record<CrudAction, CellState>,
    };
  });

  private defaultRowCellState(allowed: boolean): CellState {
    return {
      allowed,
      ownAllowed: false,
      editable: false,
      hasCondition: false,
      summary: "",
      lockTooltip: $localize`:Default permissions row tooltip:These permissions apply to every logged-in user, in addition to their roles. They can only be changed in the "Default" role.`,
    };
  }

  private cellState(
    row: MatrixRow,
    action: EntityActionPermission,
    manageAllowed: boolean,
  ): CellState {
    const cell = row.cells[action];
    const grantedBy = this.grantedBy(row, action, manageAllowed);
    return {
      allowed: !!cell?.allowed || !!grantedBy,
      ownAllowed: !!cell?.allowed,
      editable: !grantedBy,
      hasCondition: !!cell?.conditions,
      summary: cell?.conditions
        ? this.describeConditions(cell.conditions, row.subject)
        : "",
      lockTooltip: grantedBy ? this.grantedByTooltip(grantedBy) : "",
    };
  }

  /**
   * Whether a broader rule already grants this action, so it cannot be taken
   * away on this row: the row's own "manage", the role's "all record types"
   * row, or the shared "_default" role.
   */
  private grantedBy(
    row: MatrixRow,
    action: EntityActionPermission,
    manageAllowed: boolean,
  ): GrantedBy | undefined {
    if (manageAllowed && action !== "manage") {
      return "manage";
    }
    if (row.subject !== "all" && this.rowGrants(this.wildcardRow(), action)) {
      return "wildcard";
    }
    if (this.inheritedGrants(row.subject, action)) {
      return "default";
    }
    return undefined;
  }

  private grantedByTooltip(grantedBy: GrantedBy): string {
    switch (grantedBy) {
      case "manage":
        return $localize`Already granted by "Manage (all)" for this record type.`;
      case "wildcard":
        return $localize`Already granted by the "All record types" row of this role.`;
      case "default":
        return $localize`Already granted to every logged-in user by the "Default" role, so it cannot be revoked for a single role here.`;
    }
  }

  /** whether a matrix row grants the action, directly or through its "manage" */
  private rowGrants(
    row: MatrixRow | undefined,
    action: EntityActionPermission,
  ): boolean {
    if (!row) return false;
    return !!row.cells.manage?.allowed || !!row.cells[action]?.allowed;
  }

  /** whether the shared "_default" rules grant the action for every record type */
  private inheritedGrantsForAllTypes(action: EntityActionPermission): boolean {
    return this.inheritedGrants("all", action);
  }

  /** whether the shared "_default" rules grant the action for this record type */
  private inheritedGrants(
    subject: string,
    action: EntityActionPermission,
  ): boolean {
    if (this.isDefaultRole()) {
      return false;
    }
    return this.inheritedRules().some((rule) => {
      if (rule.inverted) return false;
      const subjects = Array.isArray(rule.subject)
        ? rule.subject
        : [rule.subject];
      // the wildcard row itself is only covered by a default rule that applies
      // to every record type, not by one for a single type
      const matchesSubject =
        subjects.includes("all") ||
        (subject !== "all" && subjects.includes(subject));
      const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
      return (
        matchesSubject &&
        (actions.includes(action) || actions.includes("manage"))
      );
    });
  }

  /** whether the "all" wildcard row is already present (drives the add options) */
  readonly hasAllSubject = computed(() =>
    this.model().rows.some((r) => r.subject === "all"),
  );

  /** record types already listed, so the add dropdown can omit them */
  readonly existingSubjects = computed(() =>
    this.model().rows.map((r) => r.subject),
  );

  /** the base "_default" role has no fallback to itself, so its empty state differs */
  readonly isDefaultRole = computed(
    () => this.roleName() === DEFAULT_SECTION_KEY,
  );

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
    if (!checked) {
      this.setCellAllowed(rowIndex, "manage", false);
      return;
    }

    this.emitUpdated((m) => {
      const cells = m.rows[rowIndex].cells;
      cells.manage = { allowed: true };
      // "manage" already implies the individual actions, so drop the plain ones:
      // otherwise they silently stay behind when "manage" is removed again.
      // Cells carrying a condition or properties this matrix does not model
      // (e.g. a rule managed by the backend) are kept untouched.
      for (const action of this.crudActions) {
        const cell = cells[action];
        if (cell && !cell.conditions && !cell.extra) {
          delete cells[action];
        }
      }
    });
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

  async addSubject(selected: string | string[]) {
    const subject = Array.isArray(selected) ? selected[0] : selected;
    this.addPickerOpen.set(false);
    this.resetAddSelect();
    if (!subject || this.model().rows.some((r) => r.subject === subject)) {
      return;
    }

    if (subject === "all") {
      const confirmed = await this.confirmation.getConfirmation(
        $localize`Add permissions for all record types?`,
        $localize`Whatever you allow here applies to every record type, also to types added later. Those actions can then no longer be revoked for an individual record type.`,
      );
      if (confirmed !== true) {
        return;
      }
    }
    // every new row starts with read only, including the "all" wildcard row:
    // a wildcard may grant just some actions, with the remaining ones added
    // per record type
    const cells: MatrixRow["cells"] = { read: { allowed: true } };
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
