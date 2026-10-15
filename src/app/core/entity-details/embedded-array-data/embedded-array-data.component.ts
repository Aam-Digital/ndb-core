import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Entity } from "../../entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { Logging } from "../../logging/logging.service";
import { FaDynamicIconComponent } from "../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { getSchemaEmbedArrayColumns } from "../../basic-datatypes/schema-embed/schema-embed-array-columns";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import {
  EmbeddedArrayEntryDialogComponent,
  EmbeddedArrayEntryDialogData,
} from "./embedded-array-entry-dialog/embedded-array-entry-dialog.component";
import {
  getVisibleColumnIds,
  injectCurrentScreenSize,
} from "../../../utils/media/visible-columns";

/**
 * Config format that the EmbeddedArrayDataComponent handles.
 */
export interface EmbeddedArrayDataConfig {
  /** Property of the entity holding the embedded entries (a field of dataType "schema-embed-array"). */
  property: string;

  /**
   * Columns to be displayed in the table, referencing the inner fields of the embedded entries.
   * If not set, all inner fields are displayed.
   */
  columns?: ColumnConfig[];

  /** Whether users can add and edit entries (default: true). */
  editable?: boolean;
}

/**
 * Display the entries of an entity's `schema-embed-array` property as a table,
 * looking like the {@link RelatedEntitiesComponent} list of related records.
 *
 * Clicking an entry opens a popup to view, edit or delete that single entry
 * (see {@link EmbeddedArrayEntryDialogComponent}), saving the entity directly from there.
 */
@DynamicComponent("EmbeddedArrayData")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-embedded-array-data",
  templateUrl: "./embedded-array-data.component.html",
  styleUrl: "./embedded-array-data.component.scss",
  imports: [
    MatTableModule,
    MatButtonModule,
    MatTooltipModule,
    DynamicComponentDirective,
    DisableEntityOperationDirective,
    FaDynamicIconComponent,
  ],
})
export class EmbeddedArrayDataComponent {
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly ability = inject(EntityAbility);
  private readonly dialog = inject(MatDialog);

  /** currently viewed/main entity holding the embedded entries */
  entity = input<Entity>();

  /** @see EmbeddedArrayDataConfig.property */
  property = input.required<string>();

  /** @see EmbeddedArrayDataConfig.columns */
  columns = input<ColumnConfig[]>([]);

  /** @see EmbeddedArrayDataConfig.editable */
  editable = input<boolean>(true);

  readonly ACTIONCOLUMN_EDIT = "__edit";

  private readonly fieldConfig = computed<FormFieldConfig | undefined>(() => {
    const field = this.entity()?.getSchema().get(this.property());
    return field ? { ...field, id: this.property() } : undefined;
  });

  /** All inner fields of the embedded entries, which can be edited in the popup. */
  private readonly allColumns = computed(() =>
    getSchemaEmbedArrayColumns(this.fieldConfig(), this.entitySchemaService),
  );

  /** The configured columns, extended with the inner field details (falling back to all inner fields). */
  readonly _columns = computed<FormFieldConfig[]>(() => {
    const allColumns = this.allColumns();
    const configured = this.columns();
    if (!configured?.length) {
      return allColumns;
    }

    const columns: FormFieldConfig[] = [];
    for (const column of configured) {
      const config = toFormFieldConfig(column);
      const innerField = allColumns.find((c) => c.id === config?.id);
      if (!innerField) {
        // a dangling column id must not block the rest of the table from rendering
        Logging.error("Could not display an unknown embedded table column", {
          column,
          property: this.property(),
        });
        continue;
      }
      columns.push({ ...innerField, ...config });
    }
    return columns;
  });

  private readonly currentScreenSize = injectCurrentScreenSize();

  readonly columnsToDisplay = computed(() => {
    const columns = getVisibleColumnIds(
      this._columns(),
      this.currentScreenSize(),
    );
    return this.editable() ? [this.ACTIONCOLUMN_EDIT, ...columns] : columns;
  });

  /** The embedded entries, updated locally after a save, until a new entity is given. */
  readonly rows = linkedSignal<Record<string, any>[]>(
    () => this.entity()?.[this.property()] ?? [],
  );

  /**
   * Open the popup for a single entry, displaying the saved entries once the popup saved the entity.
   * The popup is read-only if this component is not editable or the user lacks permissions.
   * @param index position of the entry to open; a new entry is created if not given
   */
  openDialog(index?: number) {
    const entity = this.entity();
    const property = this.property();
    if (!entity || !this.fieldConfig()) {
      return;
    }

    const dialogRef = this.dialog.open<
      EmbeddedArrayEntryDialogComponent,
      EmbeddedArrayEntryDialogData,
      Entity
    >(EmbeddedArrayEntryDialogComponent, {
      ...FormDialogService.dialogSettings,
      data: {
        entity,
        property,
        index,
        columns: this.allColumns(),
        readonly:
          !this.editable() || this.ability.cannot("update", entity, property),
      },
    });
    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.rows.set(saved[property] ?? []);
      }
    });
  }
}
