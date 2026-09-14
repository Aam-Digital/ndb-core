import {
  EntityForm,
  EntityFormSavedEvent,
} from "#src/app/core/common-components/entity-form/entity-form";
import { AutomatedFieldUpdateConfigService } from "#src/app/features/inherited-field/automated-field-update/automated-field-update-config.service";
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import moment from "moment";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { FieldGroup } from "../../../entity-details/form/field-group";
import { EntityFieldEditComponent } from "../../../entity/entity-field-edit/entity-field-edit.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../../entity/model/entity";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { FilterService } from "../../../filter/filter.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";

/**
 * A general purpose form component for displaying and editing entities.
 * It uses the FormFieldConfig interface for building the form fields but missing information are also fetched from
 * the entity's schema definitions. Properties with sufficient schema information can be displayed by only providing
 * the name of this property (and not an FormFieldConfig object).
 *
 * This component can be used directly or in a popup.
 * Inside the entity details component use the FormComponent which is registered as dynamic component.
 */
@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-form",
  templateUrl: "./entity-form.component.html",
  styleUrls: ["./entity-form.component.scss"],
  // Use no encapsulation because we want to change the value of children (the mat-form-fields that are
  // dynamically created)
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule, // importing FormsModule ensures that buttons anywhere inside do not trigger form submission / page reload
    EntityFieldEditComponent,
  ],
})
export class EntityFormComponent<T extends Entity = Entity> {
  private entityMapper = inject(EntityMapperService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private ability = inject(EntityAbility);
  private filterService = inject(FilterService);
  private automatedFieldUpdateConfigService = inject(
    AutomatedFieldUpdateConfigService,
  );

  /**
   * The entity which should be displayed and edited
   */
  entity = input<T>();

  fieldGroups = input<FieldGroup[]>();

  form = input<EntityForm<T>>();

  /**
   * Whether the component should use a grid layout or just rows
   */
  gridLayout = input<boolean>(true);

  /**
   * Whether the fields should use the max width of the container
   */
  fullWidth = input<boolean>(false);

  readonly entityState = signal<T | undefined>(undefined);
  readonly isEntityLocked = computed(() => !!this.entityState()?.anonymized);

  /** ids of fields currently hidden because their `displayCondition` is not met */
  private readonly conditionHiddenFieldIds = signal<ReadonlySet<string>>(
    new Set(),
  );
  /**
   * ids of fields this component has disabled because of an unmet `displayCondition`.
   *
   * Only fields tracked here are ever re-enabled by `updateFieldDisplayConditions`: a field
   * may also be disabled for unrelated reasons (the whole form is still in read-only "view"
   * mode until the user clicks "Edit", see `FormComponent`; missing update permissions; an
   * anonymized entity) and must stay disabled in that case even once its condition is met.
   */
  private readonly conditionDisabledFieldIds = new Set<string>();
  private lastDisplayConditionForm: EntityForm<T> | undefined;

  /** Field groups filtered by the current user's permissions and by `displayCondition` */
  readonly filteredFieldGroups = computed<FieldGroup[]>(() => {
    const groups = this.fieldGroups();
    const entity = this.entityState();
    if (!groups || !entity) return groups ?? [];
    const hiddenFieldIds = this.conditionHiddenFieldIds();
    return this.filterFieldGroupsByPermissions(groups, entity, hiddenFieldIds);
  });

  private initialFormValues: any;
  private changesSubscription: Subscription;

  constructor() {
    effect(() => {
      this.entityState.set(this.entity());
    });

    effect((onCleanup) => {
      const entity = this.entityState();
      if (!entity) return;
      this.changesSubscription?.unsubscribe();
      const sub = this.entityMapper
        .receiveUpdates(entity.getConstructor())
        .pipe(
          filter(({ entity: e }) => e.getId() === entity.getId()),
          filter(({ type }) => type !== "remove"),
          untilDestroyed(this),
        )
        .subscribe(({ entity: updated }) => this.applyChanges(updated as T));
      this.changesSubscription = sub;
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      const form = this.form();
      if (!form) return;
      this.initialFormValues = form.formGroup.getRawValue();
      if (this.isEntityLocked()) {
        form.formGroup.disable();
      }

      const sub = form.onFormStateChange
        .pipe(
          untilDestroyed(this),
          filter((event) => event instanceof EntityFormSavedEvent),
        )
        .subscribe(async (event: EntityFormSavedEvent) => {
          await this.automatedFieldUpdateConfigService.applyRulesToDependentEntities(
            event.newEntity,
            event.previousEntity,
          );
        });
      onCleanup(() => sub.unsubscribe());
    });

    effect((onCleanup) => {
      const form = this.form();
      if (!form) {
        this.conditionHiddenFieldIds.set(new Set());
        return;
      }

      this.updateFieldDisplayConditions(form);
      const sub = form.formGroup.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe(() => this.updateFieldDisplayConditions(form));
      onCleanup(() => sub.unsubscribe());
    });
  }

  /**
   * Re-evaluate each field's `displayCondition` (if any) against the entity's current,
   * possibly unsaved state (i.e. including the current form values) and hide/disable
   * fields whose condition is not met.
   *
   * Only touches controls that declare a `displayCondition`. A field is only re-enabled if
   * this component itself had previously disabled it for an unmet condition - never a field
   * that is disabled for some unrelated reason (the form is still in read-only "view" mode,
   * missing update permissions, an anonymized entity), so it never overrides those.
   */
  private updateFieldDisplayConditions(form: EntityForm<T>) {
    const entity = this.entityState();
    if (!entity) return;

    if (form !== this.lastDisplayConditionForm) {
      this.conditionDisabledFieldIds.clear();
      this.lastDisplayConditionForm = form;
    }

    const fieldsWithCondition = form.fieldConfigs.filter(
      (f) => f.displayCondition && Object.keys(f.displayCondition).length > 0,
    );
    if (fieldsWithCondition.length === 0) {
      this.conditionHiddenFieldIds.set(new Set());
      return;
    }

    const currentEntityState = entity.copy();
    Object.assign(currentEntityState, form.formGroup.getRawValue());

    const action = entity.isNew ? "create" : "update";
    const hiddenFieldIds = new Set<string>();

    for (const field of fieldsWithCondition) {
      const control = form.formGroup.get(field.id);
      if (!control) continue;

      const isMet = this.evaluateDisplayCondition(
        field.displayCondition,
        currentEntityState,
      );

      if (!isMet) {
        hiddenFieldIds.add(field.id);
        if (control.enabled) {
          this.conditionDisabledFieldIds.add(field.id);
          control.disable({ onlySelf: true, emitEvent: false });
        }
        continue;
      }

      if (
        this.conditionDisabledFieldIds.has(field.id) &&
        !this.isEntityLocked() &&
        this.ability.can(action, entity, field.id)
      ) {
        control.enable({ onlySelf: true, emitEvent: false });
        this.conditionDisabledFieldIds.delete(field.id);
      }
    }

    this.conditionHiddenFieldIds.set(hiddenFieldIds);
  }

  private evaluateDisplayCondition(condition: any, entity: T): boolean {
    try {
      return this.filterService.getFilterPredicate(condition)(entity);
    } catch {
      // an invalid/misconfigured condition should not hide the field entirely
      return true;
    }
  }

  private async applyChanges(externallyUpdatedEntity: T) {
    const inputEntity = this.entity();

    if (this.formIsUpToDate(externallyUpdatedEntity)) {
      if (inputEntity) {
        Object.assign(inputEntity, externallyUpdatedEntity);
      }
      this.entityState.set(externallyUpdatedEntity);
      return;
    }

    const userEditedFields = Object.entries(
      this.form().formGroup.getRawValue(),
    ).filter(([key]) => this.form().formGroup.controls[key].dirty);
    let userEditsWithoutConflicts = userEditedFields.filter(([key]) =>
      // no conflict with updated values
      this.entityEqualsFormValue(
        externallyUpdatedEntity[key],
        this.initialFormValues[key],
      ),
    );
    if (
      userEditsWithoutConflicts.length !== userEditedFields.length &&
      !(await this.confirmationDialog.getConfirmation(
        $localize`Load changes?`,
        $localize`Local changes are in conflict with updated values synced from the server. Do you want the local changes to be overwritten with the latest values?`,
      ))
    ) {
      // user "resolved" conflicts by confirming to overwrite
      userEditsWithoutConflicts = userEditedFields;
    }

    // apply update to all pristine (not user-edited) fields and update base entity (to avoid conflicts when saving)
    if (inputEntity) {
      Object.assign(inputEntity, externallyUpdatedEntity);
    }
    this.entityState.set(externallyUpdatedEntity);
    Object.assign(this.initialFormValues, externallyUpdatedEntity);
    this.form().formGroup.reset(externallyUpdatedEntity as any);

    // re-apply user-edited fields
    userEditsWithoutConflicts.forEach(([key, value]) => {
      this.form().formGroup.get(key).setValue(value);
      this.form().formGroup.get(key).markAsDirty();
    });
  }

  private formIsUpToDate(entity: T): boolean {
    return Object.entries(this.form().formGroup.getRawValue()).every(
      ([key, value]) => this.entityEqualsFormValue(entity[key], value),
    );
  }

  private filterFieldGroupsByPermissions<T extends Entity = Entity>(
    fieldGroups: FieldGroup[],
    entity: Entity,
    hiddenFieldIds: ReadonlySet<string> = new Set(),
  ): FieldGroup[] {
    const action = entity.isNew ? "create" : "read";

    return fieldGroups
      .map((group) => ({
        ...group,
        fields: group.fields.filter((field) => {
          const fieldId = typeof field === "string" ? field : field.id;
          return (
            !hiddenFieldIds.has(fieldId) &&
            this.ability.can(action, entity, fieldId)
          );
        }),
      }))
      .filter((group) => group.fields.length > 0);
  }

  private entityEqualsFormValue(entityValue, formValue) {
    return (
      (entityValue instanceof Date &&
        moment(entityValue).isSame(formValue, "day")) ||
      (entityValue === undefined && formValue === null) ||
      entityValue === formValue ||
      JSON.stringify(entityValue) === JSON.stringify(formValue)
    );
  }
}
