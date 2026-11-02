import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Signal,
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
import { differenceWith, groupBy, isEqual, uniq } from "lodash-es";
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
import { Entity } from "#src/app/core/entity/model/entity";
import { isEmptyValue } from "../add-missing-values";
import { isSameValue } from "../get-common-value";
import { AffectedEntityValueComponent } from "./affected-entity-value/affected-entity-value.component";
import { isFieldChanged } from "./change-set";
import {
  AffectedEntity,
  DialogRow,
  EnteredValue,
  UpdateTrigger,
} from "./automated-field-update.types";

/** What the user entered for an affected entity */
interface UserEntry {
  /** the affected entity, to keep showing it also if it is not suggested any more */
  row: AffectedEntity;

  /** database format */
  value: unknown;

  /** the suggestion when the user entered the value (database format) */
  suggestion: unknown;
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

/** A changed entity that caused an update, with the changes of the fields that the update is based on */
interface TriggerWithChanges {
  trigger: UpdateTrigger;
  /** calculated only when shown, as a bulk edit can change many entities */
  changes: Signal<TriggerChange[]>;
}

/** The affected entities that are based on the same field of the changed entities */
interface UpdateGroup {
  sourceFieldId: string;
  triggers: TriggerWithChanges[];
  rows: DialogRow[];
}

/** How long to wait for further changes of the user before the entities above are updated */
const RECALCULATION_DELAY_MS = 300;

function getRowKey(row: AffectedEntity): string {
  return `${row.id}|${row.targetFieldId}`;
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
    /** the changes that opened the dialog (several for a bulk edit) */
    triggers?: UpdateTrigger[];
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
        newValue: entry.row.savedValue,
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
   * The change of a field of a changed entity, by entity id and field, which does not depend on the values
   * the user enters, so that it is calculated once although the groups are made again for each entered value.
   */
  private readonly triggerChanges = new Map<string, TriggerChange>();

  /** The name of the type of the changed entities, to show how many of them caused the update */
  readonly triggerTypeLabel =
    this.data.triggers?.[0]?.entity.getConstructor().labelPlural;

  /**
   * Whether all entities directly linked to the changed entity are linked through the same field
   * (otherwise each of them shows how it is linked).
   */
  readonly allLinkedThroughSameField: boolean = this.data.entities
    .filter((entity) => entity.level === 1)
    .every(
      (entity, _, firstLevel) =>
        entity.relatedReferenceField === firstLevel[0].relatedReferenceField &&
        entity.relatedReferenceFieldEntityType ===
          firstLevel[0].relatedReferenceFieldEntityType,
    );

  private groupByTriggerField(rows: DialogRow[]): UpdateGroup[] {
    const groups = groupBy(rows, (row) => row.sourceFieldId);
    return Object.entries(groups).map(([sourceFieldId, groupRows]) => ({
      sourceFieldId,
      triggers: (this.data.triggers ?? []).map((trigger) => ({
        trigger,
        changes: computed(() =>
          this.getTriggerChanges(trigger, sourceFieldId, groupRows),
        ),
      })),
      rows: groupRows,
    }));
  }

  /** The fields of the changed entity that caused the update of the given rows, to show what changed */
  private getTriggerChanges(
    trigger: UpdateTrigger,
    sourceFieldId: string,
    groupRows: DialogRow[],
  ): TriggerChange[] {
    const entityType = trigger.entity.getConstructor();
    const firstLevel = groupRows.filter((entity) => entity.level === 1);
    // the value that is passed on, and the link to the affected entities if it was changed
    const fieldIds = uniq([
      sourceFieldId,
      ...firstLevel
        .filter(
          (entity) => entity.relatedReferenceFieldEntityType === entityType,
        )
        .map((entity) => entity.relatedReferenceField)
        .filter((fieldId) =>
          isFieldChanged(trigger.entity, trigger.before, fieldId),
        ),
    ]).filter((fieldId) => !!fieldId);
    return fieldIds
      .map((fieldId) => {
        const key = `${trigger.entity.getId()}|${fieldId}`;
        if (!this.triggerChanges.has(key)) {
          this.triggerChanges.set(key, this.getTriggerChange(trigger, fieldId));
        }
        return this.triggerChanges.get(key);
      })
      .filter(
        (change) => change.field.id === sourceFieldId || change.isChanged,
      );
  }

  private getTriggerChange(
    trigger: UpdateTrigger,
    fieldId: string,
  ): TriggerChange {
    const field = this.entityFormService.extendFormFieldConfig(
      fieldId,
      trigger.entity.getConstructor(),
    );
    const { removed, added } = this.getRemovedAndAdded(trigger, field);
    // the saved value can differ without a change of the shown values (e.g. a single link saved as a list)
    return { field, isChanged: !!(removed || added), removed, added };
  }

  /** What a change of the changed entity removed from the old value of the field, and what it added */
  private getRemovedAndAdded(
    trigger: UpdateTrigger,
    field: FormFieldConfig,
  ): Pick<TriggerChange, "removed" | "added"> {
    const oldValues = this.getValues(trigger.before, field);
    const newValues = this.getValues(trigger.entity, field);

    return {
      removed: this.withOnlyValues(
        trigger.before,
        field,
        differenceWith(oldValues, newValues, isEqual),
      ),
      added: this.withOnlyValues(
        trigger.entity,
        field,
        differenceWith(newValues, oldValues, isEqual),
      ),
    };
  }

  /** The values of the field of the entity as a list (database format), which is empty if there is no value */
  private getValues(entity: Entity, field: FormFieldConfig): unknown[] {
    const value = this.entitySchemaService.valueToDatabaseFormat(
      entity[field.id],
      field,
      entity,
    );
    return isEmptyValue(value) ? [] : asArray<unknown>(value);
  }

  /**
   * A copy of the entity that has only the given values (database format) in the field, to display them,
   * or undefined if there are none.
   */
  private withOnlyValues(
    entity: Entity,
    field: FormFieldConfig,
    values: unknown[],
  ): Entity | undefined {
    if (values.length === 0) return undefined;
    const copy = entity.copy();
    copy[field.id] = this.entitySchemaService.valueToEntityFormat(
      field.isArray ? values : values[0],
      field,
    );
    return copy;
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

  /** The saved values that the shown value does not have any more, as they are removed by it */
  private getRemovedEntity(
    row: AffectedEntity,
    value: unknown,
  ): Entity | undefined {
    if (!row.addToExisting || !Array.isArray(row.savedValue)) {
      return undefined;
    }

    return this.withOnlyValues(
      row.affectedEntity,
      row.selectedField,
      differenceWith(row.savedValue, asArray<unknown>(value ?? []), isEqual),
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
      this.rows().map((row) => ({ ...row, newValue: row.value })),
    );
  }
}
