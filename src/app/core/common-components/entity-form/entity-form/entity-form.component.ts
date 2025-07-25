import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import {
  EntityForm,
  EntityFormSavedEvent,
} from "#src/app/core/common-components/entity-form/entity-form";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { filter } from "rxjs/operators";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { NgClass } from "@angular/common";
import { Subscription } from "rxjs";
import moment from "moment";
import { EntityFieldEditComponent } from "../../entity-field-edit/entity-field-edit.component";
import { FieldGroup } from "../../../entity-details/form/field-group";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { FormsModule } from "@angular/forms";
import { AutomatedStatusUpdateConfigService } from "#src/app/features/automated-status-update/automated-status-update-config-service";

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
  selector: "app-entity-form",
  templateUrl: "./entity-form.component.html",
  styleUrls: ["./entity-form.component.scss"],
  // Use no encapsulation because we want to change the value of children (the mat-form-fields that are
  // dynamically created)
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule, // importing FormsModule ensures that buttons anywhere inside do not trigger form submission / page reload
    NgClass,
    EntityFieldEditComponent,
  ],
})
export class EntityFormComponent<T extends Entity = Entity>
  implements OnChanges
{
  private entityMapper = inject(EntityMapperService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private ability = inject(EntityAbility);
  private automatedStatusUpdateConfigService = inject(
    AutomatedStatusUpdateConfigService,
  );

  /**
   * The entity which should be displayed and edited
   */
  @Input() entity: T;

  @Input() fieldGroups: FieldGroup[];

  @Input() form: EntityForm<T>;

  /**
   * Whether the component should use a grid layout or just rows
   */
  @Input() gridLayout = true;

  private initialFormValues: any;
  private changesSubscription: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    if (this.fieldGroups) {
      this.fieldGroups = this.filterFieldGroupsByPermissions(
        this.fieldGroups,
        this.entity,
      );
    }

    if (changes.entity && this.entity) {
      this.changesSubscription?.unsubscribe();
      this.changesSubscription = this.entityMapper
        .receiveUpdates(this.entity.getConstructor())
        .pipe(
          filter(({ entity }) => entity.getId() === this.entity.getId()),
          filter(({ type }) => type !== "remove"),
          untilDestroyed(this),
        )
        .subscribe(({ entity }) => this.applyChanges(entity));
    }

    if (changes.form && this.form) {
      this.initialFormValues = this.form.formGroup.getRawValue();
      this.disableForLockedEntity();
      this.subscribeForAutomatingStatusUpdates();
    }
  }

  private formStateSubscription: Subscription;
  private subscribeForAutomatingStatusUpdates() {
    if (this.formStateSubscription) {
      this.formStateSubscription.unsubscribe();
    }

    this.formStateSubscription = this.form.onFormStateChange
      .pipe(
        untilDestroyed(this),
        filter((event) => event instanceof EntityFormSavedEvent),
      )
      .subscribe(async (event: EntityFormSavedEvent) => {
        await this.automatedStatusUpdateConfigService.applyRulesToDependentEntities(
          event.newEntity,
          event.previousEntity,
        );
      });
  }

  private async applyChanges(externallyUpdatedEntity: T) {
    if (this.formIsUpToDate(externallyUpdatedEntity)) {
      Object.assign(this.entity, externallyUpdatedEntity);
      return;
    }

    const userEditedFields = Object.entries(
      this.form.formGroup.getRawValue(),
    ).filter(([key]) => this.form.formGroup.controls[key].dirty);
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
    Object.assign(this.entity, externallyUpdatedEntity);
    Object.assign(this.initialFormValues, externallyUpdatedEntity);
    this.form.formGroup.reset(externallyUpdatedEntity as any);

    // re-apply user-edited fields
    userEditsWithoutConflicts.forEach(([key, value]) => {
      this.form.formGroup.get(key).setValue(value);
      this.form.formGroup.get(key).markAsDirty();
    });
  }

  private formIsUpToDate(entity: T): boolean {
    return Object.entries(this.form.formGroup.getRawValue()).every(
      ([key, value]) => this.entityEqualsFormValue(entity[key], value),
    );
  }

  private filterFieldGroupsByPermissions<T extends Entity = Entity>(
    fieldGroups: FieldGroup[],
    entity: Entity,
  ): FieldGroup[] {
    const action = entity.isNew ? "create" : "read";

    return fieldGroups
      .map((group) => {
        group.fields = group.fields.filter((field) =>
          this.ability.can(
            action,
            entity,
            typeof field === "string" ? field : field.id,
          ),
        );
        return group;
      })
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

  /**
   * Disable the form for certain states of the entity, like it being already anonymized.
   * @private
   */
  private disableForLockedEntity() {
    if (this.entity?.anonymized) {
      this.form.formGroup.disable();
    }
  }
}
