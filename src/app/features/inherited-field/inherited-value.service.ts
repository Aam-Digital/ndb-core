import { inject, Injectable, Signal, signal } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";
import { EntityForm } from "../../core/common-components/entity-form/entity-form";
import { Entity } from "../../core/entity/model/entity";
import {
  AdminDefaultValueContext,
  DefaultValueStrategy,
} from "../../core/default-values/default-value-strategy.interface";
import { DefaultValueHint } from "../../core/default-values/default-value-service/default-value.service";
import { asArray } from "../../utils/asArray";
import { FormFieldConfig } from "../../core/common-components/entity-form/FormConfig";
import {
  DefaultValueConfigInheritedField,
  isCollectingFromLinkedRecords,
  isInheritingFromParent,
} from "./inherited-field-config";
import { isEqual, xorWith } from "lodash-es";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import {
  AutomatedFieldUpdateConfigService,
  CommonValueOfParents,
} from "./automated-field-update/automated-field-update-config.service";
import { Logging } from "../../core/logging/logging.service";
import { isSameValue } from "./get-common-value";
import {
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from "rxjs";

/**
 * The value to inherit from the parent records currently linked in a form.
 */
interface InheritedValueState extends CommonValueOfParents {
  parentIds: string[];

  /** whether the parent records are still being loaded (and the other properties are not set yet) */
  isLoading?: boolean;
}

/**
 * The inherited value of a field in a form, loaded again whenever the linked parent records change.
 */
interface WatchedInheritedValue {
  /** the latest state, to display it reactively */
  state: Signal<InheritedValueState>;

  /** emits the loaded value for every change of the linked parent records, while it is subscribed to */
  loaded$: Observable<InheritedValueState>;
}

/**
 * An advanced default-value strategy that sets values based on the value in a referenced related entity.
 *
 * This allows to configure hierarchies and inherited fields,
 * e.g. setting the category field based on the category field in a linked "parent entity".
 */
@Injectable({
  providedIn: "root",
})
export class InheritedValueService extends DefaultValueStrategy {
  override readonly mode = "inherited-field";

  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly automatedFieldUpdateConfigService = inject(
    AutomatedFieldUpdateConfigService,
  );

  /**
   * Values inherited from the parent records that this record links to
   * (e.g. a child inheriting the category of its school), by form and field id.
   * Loaded again whenever the linked parents in the form change.
   */
  private readonly valuesFromParents = new WeakMap<
    EntityForm<any>,
    Map<string, WatchedInheritedValue>
  >();

  /**
   * Values collected from all records that link to this record
   * (e.g. a school collecting the cities of all its children), by form and field id.
   * Loaded once when the form is created (in database format).
   */
  private readonly valuesFromLinkingRecords = new WeakMap<
    EntityForm<any>,
    Map<string, unknown[] | undefined>
  >();

  override async getAdminUI(): Promise<AdminDefaultValueContext> {
    const component =
      await import("./admin-inherited-field/admin-inherited-field.component").then(
        (c) => c.AdminInheritedFieldComponent,
      );

    return {
      mode: this.mode,
      component,
      icon: "circle-nodes",
      description: $localize`value inherited or auto-updated from related records`,
    };
  }

  override async initEntityForm<T extends Entity>(form: EntityForm<T>) {
    await this.watchInheritedValues(form);
    await this.collectValuesOfLinkedRecords(form);
  }

  /**
   * For fields collecting the values of all records that link to this entity,
   * load these records once to be able to compare and sync the field's value.
   */
  private async collectValuesOfLinkedRecords<T extends Entity>(
    form: EntityForm<T>,
  ) {
    if (form.entity.isNew) {
      return;
    }

    const collectingFields = form.fieldConfigs.filter(
      isCollectingFromLinkedRecords,
    );
    const collectedValuesOfForm = new Map<string, unknown[] | undefined>();
    this.valuesFromLinkingRecords.set(form, collectedValuesOfForm);
    await Promise.all(
      collectingFields.map(async (field) =>
        collectedValuesOfForm.set(
          field.id,
          await this.automatedFieldUpdateConfigService
            .collectValuesOfLinkedRecords(
              form.entity,
              field.defaultValue.config,
            )
            .catch((error) => {
              Logging.warn(
                "InheritedValueService could not load linked records for collected field",
                { field: field.id },
                error,
              );
              return undefined;
            }),
        ),
      ),
    );
  }

  /**
   * Set up the inheritance value for a field, triggering an initial inheritance
   * and watching future changes of the source (parent) field for automatic updates.
   * @param targetFormControl
   * @param fieldConfig
   * @param form
   */
  override async setDefaultValue(
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
    form: EntityForm<any>,
  ) {
    // automation rules are handled by the AutomatedFieldUpdateConfigService instead
    if (!isInheritingFromParent(fieldConfig)) {
      return;
    }
    const config: DefaultValueConfigInheritedField =
      fieldConfig.defaultValue.config;

    const { loaded$ } = this.getInheritedValue(form, fieldConfig.id, config);
    // inherit the value initially and whenever the linked parents change
    form.watcher.set(
      "inheritIntoNewRecord_" + fieldConfig.id,
      loaded$.subscribe((inherited) =>
        this.inheritIntoNewRecord(
          form,
          targetFormControl,
          fieldConfig,
          inherited,
        ),
      ),
    );
    await firstValueFrom(loaded$);
  }

  /**
   * Set the inherited value to the target field of a new record,
   * unless the user has entered a value there.
   * @param form
   * @param targetFormControl
   * @param fieldConfig
   * @param inherited The value loaded from the currently linked parents.
   * @private
   */
  private inheritIntoNewRecord(
    form: EntityForm<any>,
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
    inherited: InheritedValueState,
  ) {
    if (
      form.formGroup.disabled ||
      !form.entity.isNew ||
      (targetFormControl.dirty && !!targetFormControl.value)
    ) {
      return;
    }

    if (inherited.value === undefined) {
      targetFormControl.setValue(undefined);
      return;
    }

    // always wrap a single source value in an array if the target field holds several values
    targetFormControl.setValue(
      this.entitySchemaService.valueToEntityFormat(
        fieldConfig.isArray ? asArray(inherited.value) : inherited.value,
        fieldConfig,
      ),
    );

    targetFormControl.markAsUntouched();
    targetFormControl.markAsPristine();
  }

  /**
   * Get details about the status and context of an inherited value field
   * to display to the user.
   * @param form
   * @param field
   */
  override getDefaultValueUiHint<T extends Entity>(
    form: EntityForm<T>,
    field: FormFieldConfig,
  ): DefaultValueHint | undefined {
    const defaultConfig: DefaultValueConfigInheritedField =
      field?.defaultValue?.config;
    if (!defaultConfig) {
      return;
    }

    if (isCollectingFromLinkedRecords(field)) {
      return this.getCollectedValuesUiHint(form, field, defaultConfig);
    }

    // only watched for inheritance configs (not automation rules)
    // in forms initialized with default values (not e.g. when merging records)
    const watchedValue = this.valuesFromParents.get(form)?.get(field.id);
    if (!watchedValue) {
      return;
    }

    // reading the signal lets reactive callers update the hint once the linked parents are loaded
    const inherited = watchedValue.state();
    if (inherited.parentIds.length === 0) {
      return {
        inheritedFromField: defaultConfig.sourceReferenceField,
        isEmpty: true,
      };
    }

    if (inherited.isLoading || inherited.noCommonValue) {
      return {
        inheritedFromField: defaultConfig.sourceReferenceField,
        isEmpty: true,
        isLoading: inherited.isLoading,
        noCommonValue: inherited.noCommonValue,
      };
    }

    return {
      inheritedFromField: defaultConfig.sourceReferenceField,
      inheritedFromType: Entity.extractTypeFromId(inherited.parentIds[0]),
      isInSync: isSameValue(
        inherited.value,
        this.getCurrentDatabaseValue(form, field),
      ),
      syncFromParentField: () =>
        this.setDatabaseValueToForm(form, field, inherited.value),
    };
  }

  /**
   * Hint for a field collecting the values of all records that link to this entity.
   * No hint is shown as long as there are no values of linked records to sync from.
   */
  private getCollectedValuesUiHint<T extends Entity>(
    form: EntityForm<T>,
    field: FormFieldConfig,
    config: DefaultValueConfigInheritedField,
  ): DefaultValueHint | undefined {
    const collectedValues = this.valuesFromLinkingRecords
      .get(form)
      ?.get(field.id);
    if (!collectedValues?.length) {
      return;
    }

    return {
      inheritedFromField: config.sourceReferenceField,
      inheritedFromType: config.sourceReferenceEntity,
      isCollectedFromLinkedRecords: true,
      // the order of values does not matter here
      isInSync:
        xorWith(
          collectedValues,
          asArray(this.getCurrentDatabaseValue(form, field) ?? []),
          isEqual,
        ).length === 0,
      syncFromParentField: () =>
        this.setDatabaseValueToForm(form, field, collectedValues),
    };
  }

  /**
   * The collected values and rule results are in database format (e.g. the id of a dropdown value),
   * whereas the form holds the entity format (e.g. the full dropdown value object).
   * Comparing and merging both in database format avoids false mismatches and objects saved instead of ids.
   */
  private getCurrentDatabaseValue<T extends Entity>(
    form: EntityForm<T>,
    field: FormFieldConfig,
  ) {
    return this.automatedFieldUpdateConfigService.transformSourceValueToDatabaseFormat(
      form.formGroup.get(field.id)?.value,
      form.entity,
      field.id,
      this.entitySchemaService,
    );
  }

  private setDatabaseValueToForm<T extends Entity>(
    form: EntityForm<T>,
    field: FormFieldConfig,
    databaseValue: any,
  ) {
    form.formGroup
      .get(field.id)
      .setValue(
        this.entitySchemaService.valueToEntityFormat(databaseValue, field),
      );
  }

  /**
   * Keep the inherited value of each field up to date with the parent records linked in the form
   * (also for existing records, to compare the field's value with it).
   * @return resolves once the inherited values of the initially linked parents are loaded
   */
  private async watchInheritedValues<T extends Entity>(form: EntityForm<T>) {
    const inheritedConfigs = getConfigsForInheritedMode(form.fieldConfigs);
    await Promise.all(
      [...inheritedConfigs].map(([fieldId, config]) => {
        const { loaded$ } = this.getInheritedValue(form, fieldId, config);
        form.watcher.set("inheritedValue_" + fieldId, loaded$.subscribe());
        return firstValueFrom(loaded$);
      }),
    );
  }

  /**
   * Get the inherited value of a field in the form,
   * setting it up to be loaded again whenever the linked parents change, if not done yet.
   * Loading only starts when subscribing to its `loaded$`.
   */
  private getInheritedValue<T extends Entity>(
    form: EntityForm<T>,
    fieldId: string,
    config: DefaultValueConfigInheritedField,
  ): WatchedInheritedValue {
    const existing = this.valuesFromParents.get(form)?.get(fieldId);
    if (existing) {
      return existing;
    }

    const state = signal<InheritedValueState>({
      parentIds: this.getParentRefIds(form, config),
      isLoading: true,
    });
    const sourceFormControl = form.formGroup?.get(config.sourceReferenceField);
    const loaded$ = (sourceFormControl?.valueChanges ?? of()).pipe(
      startWith(undefined),
      map(() => this.getParentRefIds(form, config)),
      distinctUntilChanged(isEqual),
      tap((parentIds) => state.set({ parentIds, isLoading: true })),
      // a newer change of the linked parents discards the result of a load still in progress
      switchMap((parentIds) =>
        // without linked parents, the field is reset right away
        parentIds.length === 0
          ? of({ parentIds })
          : this.loadInheritedValue(parentIds, config, fieldId),
      ),
      tap((inherited) => state.set(inherited)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    const watchedValue = { state: state.asReadonly(), loaded$ };
    this.valuesFromParents.set(
      form,
      (this.valuesFromParents.get(form) ?? new Map()).set(
        fieldId,
        watchedValue,
      ),
    );
    return watchedValue;
  }

  /**
   * Load the linked parent entities and get the value they all have in common
   * (in database format, with the value mapping of the rule applied).
   */
  private async loadInheritedValue(
    parentIds: string[],
    config: DefaultValueConfigInheritedField,
    fieldId: string,
  ): Promise<InheritedValueState> {
    try {
      return {
        parentIds,
        ...(await this.automatedFieldUpdateConfigService.loadCommonValue(
          parentIds,
          config,
        )),
      };
    } catch (error) {
      // a bug, but later changes of the linked parents are still watched
      Logging.error(
        "InheritedValueService could not determine the inherited value",
        { field: fieldId },
        error,
      );
      return { parentIds, noCommonValue: "unavailable" };
    }
  }

  /**
   * Get the ids of the linked parent entities from the form or entity.
   * @param form
   * @param defaultConfig
   * @return the ids of all linked parent entities (empty if none are linked)
   * @private
   */
  private getParentRefIds<T extends Entity>(
    form: EntityForm<T>,
    defaultConfig: DefaultValueConfigInheritedField,
  ): string[] {
    const sourceFormControl = form.formGroup?.get(
      defaultConfig.sourceReferenceField,
    );
    // if the field is in the form, its value counts even when the user cleared it
    const linkedFieldValue = sourceFormControl
      ? sourceFormControl.value
      : form.entity?.[defaultConfig.sourceReferenceField];

    return asArray(linkedFieldValue ?? []).filter((id) => !!id);
  }
}

/**
 * Get the default value configs filtered for the given mode,
 * excluding automation rules (with sourceReferenceEntity), which are handled by the AutomatedFieldUpdateConfigService.
 * @param fieldConfigs
 */
export function getConfigsForInheritedMode(
  fieldConfigs: FormFieldConfig[],
): Map<string, DefaultValueConfigInheritedField> {
  return new Map(
    fieldConfigs
      .filter(isInheritingFromParent)
      .map((field) => [field.id, field.defaultValue.config]),
  );
}
