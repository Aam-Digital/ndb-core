import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { FormFieldConfig } from "./FormConfig";
import { EntityForm } from "../entity-form.service";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { filter } from "rxjs/operators";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

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
})
export class EntityFormComponent<T extends Entity = Entity> implements OnInit {
  /**
   * The entity which should be displayed and edited
   */
  @Input() entity: T;

  @Input() columns: FormFieldConfig[][];

  @Input() columnHeaders?: (string | null)[];

  @Input() set form(form: EntityForm<T>) {
    this._form = form;
    this.initialFormValues = form.getRawValue();
  }

  _form: EntityForm<T>;
  initialFormValues: any;

  constructor(
    private entityMapper: EntityMapperService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit() {
    this.entityMapper
      .receiveUpdates(this.entity.getConstructor())
      .pipe(
        filter(({ entity }) => entity.getId() === this.entity.getId()),
        untilDestroyed(this)
      )
      .subscribe(({ entity }) => this.applyChanges(entity));
  }

  private async applyChanges(entity: T) {
    if (this.formIsUpToDate(entity)) {
      // this is the component that currently saves the values -> no need to apply changes.
      return;
    }
    if (
      this.changesOnlyAffectPristineFields(entity) ||
      (await this.confirmationDialog.getConfirmation(
        $localize`Load changes?`,
        $localize`Local changes are in conflict with updated values synced from the server. Do you want the local changes to be overwritten with the latest values?`
      ))
    ) {
      Object.assign(this.initialFormValues, entity);
      this._form.patchValue(entity as any);
    }
  }

  private changesOnlyAffectPristineFields(updatedEntity: T) {
    if (this._form.pristine) {
      return true;
    }

    const dirtyFields = Object.entries(this._form.controls).filter(
      ([_, form]) => form.dirty
    );
    for (const [key] of dirtyFields) {
      if (
        this.entityEqualsFormValue(
          updatedEntity[key],
          this.initialFormValues[key]
        )
      ) {
        // keep our pending form field changes
        delete updatedEntity[key];
      } else {
        // dirty form field has conflicting change
        return false;
      }
    }

    return true;
  }

  private formIsUpToDate(entity: T): boolean {
    return Object.entries(this._form.getRawValue()).every(([key, value]) => {
      return this.entityEqualsFormValue(entity[key], value);
    });
  }

  private entityEqualsFormValue(entityValue, formValue) {
    return (
      (entityValue === undefined && formValue === null) ||
      entityValue === formValue ||
      JSON.stringify(entityValue) === JSON.stringify(formValue)
    );
  }
}
