import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { MatButton } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatTooltipModule } from "@angular/material/tooltip";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityFieldViewComponent } from "#src/app/core/entity/entity-field-view/entity-field-view.component";
import { HelpButtonComponent } from "#src/app/core/common-components/help-button/help-button.component";
import { EntityFieldLabelPipe } from "#src/app/core/entity/entity-field-label/entity-field-label.pipe";
import { differenceWith, isEqual, uniq } from "lodash-es";
import { asArray } from "#src/app/utils/asArray";
import {
  catchError,
  debounceTime,
  EMPTY,
  from,
  map,
  Subject,
  switchMap,
} from "rxjs";
import { Logging } from "#src/app/core/logging/logging.service";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { NoCommonValueReason } from "#src/app/core/default-values/default-value-service/default-value.service";
import { isEmptyValue } from "../add-missing-values";
import { isSameValue } from "../get-common-value";
import { AffectedEntityValueComponent } from "./affected-entity-value/affected-entity-value.component";

/**
 * Represents an entity that will be affected by a status update.
 * This interface is used to define the structure of the data
 * that will be passed to the
 * AutomatedFieldUpdateComponent for processing.
 */
export interface AffectedEntity {
  /** entityId of the affected entity */
  id: string;

  /** New value to be applied to the target field (database format; entity format in the result of the dialog) */
  newValue: unknown;

  /** Field Id that will receive the status update */
  targetFieldId: string;

  /** Entity type constructor for the target entity */
  targetEntityType: EntityConstructor;

  /** Actual entity which is being modified through automatedconfig rule */
  affectedEntity?: Entity;

  /** Reference field name that triggered the status update */
  relatedReferenceField: string;

  /** Entity type where the related reference field is defined */
  relatedReferenceFieldEntityType?: EntityConstructor;

  selectedField?: FormFieldConfig;

  /** Whether the new value is merged into the existing values instead of replacing them completely */
  addToExisting?: boolean;

  /** Why the entities linked to the affected entity provide no value in common, so the current value is kept */
  noCommonValue?: NoCommonValueReason;

  /** Whether the affected entity is no longer linked to the changed entity */
  unlinked?: boolean;

  /** The field of the changed entity that this update is based on */
  sourceFieldId?: string;

  /** How many levels above the changed entity the affected entity is (1 = directly linked) */
  level?: number;

  /** Ids of the records this one is reached from (the changed entity, or affected entities of the level below) */
  via?: string[];
}

/** An affected entity as shown in the dialog, with the value shown in its form */
export interface DialogRow extends AffectedEntity {
  /** The value the user entered, otherwise the suggested value (database format) */
  value: unknown;

  /** Whether the user changed the suggested value */
  edited: boolean;

  /** Whether the suggestion changed after the user had changed the value (the value of the user is kept) */
  suggestionChanged: boolean;

  /**
   * A copy of the affected entity that only has the values of the field that the shown value removes
   * (for fields that add to the existing values), to display them.
   */
  removedEntity?: Entity;
}

/** What the user entered for an affected entity */
interface UserEntry {
  /** the affected entity, to keep showing it also if it is not suggested any more */
  row: AffectedEntity;

  /** database format */
  value: unknown;

  /** the suggestion when the user entered the value (database format) */
  suggestion: unknown;
}

/** The change that opened the update dialog */
export interface UpdateTrigger {
  /** The changed entity */
  entity: Entity;

  /** The changed entity before the change (the same as entity if there is no change) */
  before: Entity;

  /** The field of the entity to pass on to the entities it links to, regardless of a change (from the button next to the field) */
  fieldId?: string;
}

/** A value that the user entered for an affected entity, instead of the suggested one */
export interface EnteredValue {
  id: string;
  targetFieldId: string;

  /** in database format */
  value: unknown;
}

/** A field of the changed entity that caused an update, and whether its value was changed */
interface TriggerChange {
  field: FormFieldConfig;
  isChanged: boolean;

  /** The old values that the change removed, as an entity with only these values (to display them) */
  removed?: Entity;

  /** The values that the change added, as an entity with only these values (to display them) */
  added?: Entity;
}

/** The affected entities that are based on the same field of the changed entity */
interface UpdateGroup {
  sourceFieldId: string;
  changes: TriggerChange[];
  rows: DialogRow[];
}

/** How long to wait for further changes of the user before the entities above are updated */
const RECALCULATION_DELAY_MS = 300;

function getRowKey(row: AffectedEntity): string {
  return `${row.id}|${row.targetFieldId}`;
}

/** The values that the other values do not have (values like configurable enums are objects, the same if they have the same id) */
function getMissingValues(values: unknown[], other: unknown[]): unknown[] {
  type Value = { id?: unknown } | undefined;
  return differenceWith(
    values as Value[],
    other as Value[],
    (a, b) => isEqual(a, b) || (a?.id !== undefined && a.id === b?.id),
  );
}

/** A copy of the entity that has only the given values in the field, or undefined if there are none */
function withOnlyValues(
  entity: Entity,
  fieldId: string,
  values: unknown[],
  isMultiValue: boolean,
): Entity | undefined {
  if (values.length === 0) return undefined;
  const copy = entity.copy();
  copy[fieldId] = isMultiValue ? values : values[0];
  return copy;
}

/**
 * A confirmation dialog for the user to review and confirm
 * the automated updates of fields in related entities,
 * after a triggering entity has been updated.
 *
 * The suggestions and what the user entered are kept apart: the suggestions are calculated again
 * whenever the user enters a value (as the entities above are based on it), what the user entered stays.
 *
 * (also see AutomatedFieldUpdateConfigService)
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-automated-field-update",
  imports: [
    AffectedEntityValueComponent,
    DialogCloseComponent,
    EntityBlockComponent,
    EntityFieldLabelPipe,
    EntityFieldViewComponent,
    FaDynamicIconComponent,
    HelpButtonComponent,
    HintBoxComponent,
    MatButton,
    MatDialogModule,
    MatExpansionModule,
    MatTooltipModule,
  ],
  templateUrl: "./automated-field-update.component.html",
  styleUrl: "./automated-field-update.component.scss",
})
export class AutomatedFieldUpdateComponent {
  data = inject<{
    entities: AffectedEntity[];
    trigger?: UpdateTrigger;
    /** Finds the affected entities again, based on the values the user entered instead of the suggestions */
    recalculate?: (enteredValues: EnteredValue[]) => Promise<AffectedEntity[]>;
  }>(MAT_DIALOG_DATA);
  private dialogRef =
    inject<MatDialogRef<AutomatedFieldUpdateComponent>>(MatDialogRef);
  private readonly entityFormService = inject(EntityFormService);
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly destroyRef = inject(DestroyRef);

  /** The suggested updates */
  private readonly suggestions = signal<AffectedEntity[]>(this.data.entities);

  /** What the user entered, by row key */
  private readonly entries = signal(new Map<string, UserEntry>());

  /** The entries that the current suggestions are calculated for */
  private readonly calculatedFor = signal(this.entries());
  private readonly entriesChanged = new Subject<Map<string, UserEntry>>();

  /** The shown rows: the suggestions, and the rows the user changed (also if they are not suggested any more) */
  readonly rows = computed<DialogRow[]>(() => {
    const entries = this.entries();
    const suggestions = this.suggestions();
    const suggestedKeys = new Set(suggestions.map(getRowKey));
    const notSuggestedAnyMore = [...entries.values()]
      .filter((entry) => !suggestedKeys.has(getRowKey(entry.row)))
      .map((entry) => ({
        ...entry.row,
        newValue: this.getSavedValue(entry.row),
        // the hints of the earlier suggestion
        noCommonValue: undefined,
        unlinked: undefined,
      }));
    return [...suggestions, ...notSuggestedAnyMore].map((row) =>
      this.toDialogRow(row, entries.get(getRowKey(row))),
    );
  });

  /** Whether the entities above are being updated after a change, which has to finish before saving */
  readonly recalculating = computed(
    () => !!this.data.recalculate && this.entries() !== this.calculatedFor(),
  );

  /** Whether the last update of the entities above failed, so that it has to be tried again with a change */
  readonly recalculationFailed = signal(false);

  /** The affected entities, grouped by the field of the changed entity that the update is based on */
  readonly groups = computed(() => this.groupByTriggerField(this.rows()));

  /**
   * The first entity directly linked to the changed entity, if all of them are linked through the same field
   * (otherwise each of them shows how it is linked).
   */
  readonly sharedLinkEntity: AffectedEntity | undefined =
    this.getSharedLinkEntity();

  private getSharedLinkEntity(): AffectedEntity | undefined {
    const firstLevel = this.data.entities.filter(
      (entity) => (entity.level ?? 1) === 1,
    );
    return firstLevel.every(
      (entity) =>
        entity.relatedReferenceField === firstLevel[0].relatedReferenceField &&
        entity.relatedReferenceFieldEntityType ===
          firstLevel[0].relatedReferenceFieldEntityType,
    )
      ? firstLevel[0]
      : undefined;
  }

  private groupByTriggerField(rows: DialogRow[]): UpdateGroup[] {
    const groups = new Map<string, DialogRow[]>();
    for (const row of rows) {
      const fieldId = this.getTriggerFieldId(row, rows);
      groups.set(fieldId, [...(groups.get(fieldId) ?? []), row]);
    }
    return [...groups].map(([fieldId, groupRows]) => ({
      sourceFieldId: fieldId,
      changes: this.getTriggerChanges(fieldId, groupRows),
      rows: groupRows,
    }));
  }

  /** The field of the changed entity that the update of the given entity is based on, over all levels */
  private getTriggerFieldId(
    row: AffectedEntity,
    rows: AffectedEntity[],
  ): string {
    let current = row;
    while ((current.level ?? 1) > 1) {
      const below = rows.find(
        (r) =>
          (r.level ?? 1) < current.level &&
          current.via?.includes(r.id) &&
          r.targetFieldId === current.sourceFieldId,
      );
      if (!below) break;
      current = below;
    }
    return current.sourceFieldId;
  }

  /** The fields of the changed entity that caused the update of the given rows, to show what changed */
  private getTriggerChanges(
    sourceFieldId: string,
    groupRows: DialogRow[],
  ): TriggerChange[] {
    const trigger = this.data.trigger;
    if (!trigger) return [];

    const entityType = trigger.entity.getConstructor();
    const isChanged = (fieldId: string) =>
      JSON.stringify(trigger.before[fieldId]) !==
      JSON.stringify(trigger.entity[fieldId]);
    const firstLevel = groupRows.filter((entity) => (entity.level ?? 1) === 1);
    // the value that is passed on, and the link to the affected entities if it was changed
    const fieldIds = uniq([
      sourceFieldId,
      ...firstLevel
        .filter(
          (entity) => entity.relatedReferenceFieldEntityType === entityType,
        )
        .map((entity) => entity.relatedReferenceField)
        .filter(isChanged),
    ]).filter((fieldId) => !!fieldId);
    return fieldIds.map((fieldId) => ({
      field: this.entityFormService.extendFormFieldConfig(fieldId, entityType),
      isChanged: isChanged(fieldId),
      ...this.getRemovedAndAdded(trigger, fieldId),
    }));
  }

  /** What a change of the changed entity removed from the old value of the field, and what it added */
  private getRemovedAndAdded(
    trigger: UpdateTrigger,
    fieldId: string,
  ): Pick<TriggerChange, "removed" | "added"> {
    const oldValue = trigger.before[fieldId];
    const newValue = trigger.entity[fieldId];
    const isMultiValue = Array.isArray(oldValue) || Array.isArray(newValue);
    const toValues = (value: unknown) =>
      isEmptyValue(value) ? [] : asArray<unknown>(value);
    const oldValues = toValues(oldValue);
    const newValues = toValues(newValue);

    return {
      removed: withOnlyValues(
        trigger.before,
        fieldId,
        getMissingValues(oldValues, newValues),
        isMultiValue,
      ),
      added: withOnlyValues(
        trigger.entity,
        fieldId,
        getMissingValues(newValues, oldValues),
        isMultiValue,
      ),
    };
  }

  constructor() {
    this.recalculateOnChange();
  }

  private toDialogRow(row: AffectedEntity, entry?: UserEntry): DialogRow {
    const value = entry ? entry.value : row.newValue;
    return {
      ...row,
      value,
      edited: !!entry,
      suggestionChanged:
        !!entry && !isSameValue(entry.suggestion, row.newValue),
      removedEntity: this.getRemovedEntity(row, value),
    };
  }

  /** The current values that the shown value does not have any more, as they are removed by it */
  private getRemovedEntity(
    row: AffectedEntity,
    value: unknown,
  ): Entity | undefined {
    const current = row.affectedEntity?.[row.targetFieldId];
    if (!row.addToExisting || !Array.isArray(current)) {
      return undefined;
    }

    const shown = asArray<unknown>(
      this.entitySchemaService.valueToEntityFormat(value, row.selectedField) ??
        [],
    );
    return withOnlyValues(
      row.affectedEntity,
      row.targetFieldId,
      getMissingValues(current, shown),
      true,
    );
  }

  /** The saved value of the affected entity (database format) */
  private getSavedValue(row: AffectedEntity): unknown {
    return this.entitySchemaService.valueToDatabaseFormat(
      row.affectedEntity[row.targetFieldId],
      row.selectedField,
      row.affectedEntity,
    );
  }

  /** The user entered a value for the row (database format) */
  onValueChange(row: DialogRow, value: unknown): void {
    const entries = new Map(this.entries());
    const key = getRowKey(row);
    if (isSameValue(value, row.newValue)) {
      entries.delete(key);
    } else {
      entries.set(key, {
        row,
        value,
        suggestion: entries.get(key)?.suggestion ?? row.newValue,
      });
    }
    this.setEntries(entries);
  }

  /** Replace the value that the user entered with the suggested value */
  useSuggestion(row: DialogRow): void {
    const entries = new Map(this.entries());
    entries.delete(getRowKey(row));
    this.setEntries(entries);
  }

  private setEntries(entries: Map<string, UserEntry>): void {
    this.recalculationFailed.set(false);
    this.entries.set(entries);
    this.entriesChanged.next(entries);
  }

  /** Suggest the values of the entities above again whenever a value is entered, as they are based on it */
  private recalculateOnChange(): void {
    if (!this.data.recalculate) return;

    this.entriesChanged
      .pipe(
        debounceTime(RECALCULATION_DELAY_MS),
        switchMap((entries) =>
          from(
            this.data.recalculate(
              [...entries.values()].map(({ row, value }) => ({
                id: row.id,
                targetFieldId: row.targetFieldId,
                value,
              })),
            ),
          ).pipe(
            map((suggestions) => ({ entries, suggestions })),
            catchError((error) => this.onRecalculationFailed(error)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ entries, suggestions }) => {
        this.suggestions.set(suggestions);
        this.calculatedFor.set(entries);
      });
  }

  /**
   * Keep listening for changes, so that a later change tries again. Until an update succeeds,
   * saving stays disabled, because the entities above could be based on an outdated value.
   */
  private onRecalculationFailed(error: unknown) {
    Logging.warn(
      "AutomatedFieldUpdate: Could not update the suggestions for the entities above",
      error,
    );
    this.recalculationFailed.set(true);
    return EMPTY;
  }

  onConfirm(): void {
    this.dialogRef.close(
      this.rows().map((row) => ({
        ...row,
        newValue: this.entitySchemaService.valueToEntityFormat(
          row.value,
          row.selectedField,
        ),
      })),
    );
  }
}
