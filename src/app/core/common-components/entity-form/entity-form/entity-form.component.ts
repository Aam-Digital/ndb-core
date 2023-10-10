import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { FormFieldConfig } from "./FormConfig";
import { EntityForm } from "../entity-form.service";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { filter } from "rxjs/operators";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { DynamicComponentDirective } from "../../../config/dynamic-components/dynamic-component.directive";
import { Subscription } from "rxjs";
import moment from "moment";
import { HelpButtonComponent } from "../../help-button/help-button.component";

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
    NgForOf,
    DynamicComponentDirective,
    NgIf,
    NgClass,
    HelpButtonComponent,
  ],
  standalone: true,
})
export class EntityFormComponent<T extends Entity = Entity>
  implements OnChanges
{
  /**
   * The entity which should be displayed and edited
   */
  @Input() entity: T;

  @Input() columns: FormFieldConfig[][];

  @Input() columnHeaders?: (string | null)[];

  @Input() form: EntityForm<T>;

  /**
   * Whether the component should use a grid layout or just rows
   */
  @Input() gridLayout = true;

  private initialFormValues: any;
  private changesSubscription: Subscription;

  constructor(
    private entityMapper: EntityMapperService,
    private confirmationDialog: ConfirmationDialogService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
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
      this.initialFormValues = this.form.getRawValue();
    }
  }

  private async applyChanges(externallyUpdatedEntity: T) {
    if (this.formIsUpToDate(externallyUpdatedEntity)) {
      Object.assign(this.entity, externallyUpdatedEntity as any);
      return;
    }

    const userEditedFields = Object.entries(this.form.getRawValue()).filter(
      ([key, value]) => this.form.controls[key].dirty,
    );
    let userEditsToReapply = userEditedFields.filter(([key, value]) =>
      // no conflict with updated values
      this.entityEqualsFormValue(
        externallyUpdatedEntity[key],
        this.initialFormValues[key],
      ),
    );
    if (
      userEditsToReapply.length !== userEditedFields.length &&
      !(await this.confirmationDialog.getConfirmation(
        $localize`Load changes?`,
        $localize`Local changes are in conflict with updated values synced from the server. Do you want the local changes to be overwritten with the latest values?`,
      ))
    ) {
      userEditsToReapply = userEditedFields;
    }

    // apply update to all pristine (not user-edited) fields and update base entity (to avoid conflicts when saving)
    Object.assign(this.entity, externallyUpdatedEntity as any);
    Object.assign(this.initialFormValues, externallyUpdatedEntity);
    this.form.reset(externallyUpdatedEntity as any);

    // re-apply user-edited fields
    userEditsToReapply.forEach(([key, value]) => {
      this.form.get(key).setValue(value);
      this.form.get(key).markAsDirty();
    });
  }

  private formIsUpToDate(entity: T): boolean {
    return Object.entries(this.form.getRawValue()).every(([key, value]) =>
      this.entityEqualsFormValue(entity[key], value),
    );
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
