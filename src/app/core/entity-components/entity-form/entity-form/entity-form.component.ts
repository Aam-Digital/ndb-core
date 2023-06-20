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
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { filter } from "rxjs/operators";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { DynamicComponentDirective } from "../../../view/dynamic-components/dynamic-component.directive";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Subscription } from "rxjs";
import moment from "moment";

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
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
    NgClass,
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
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.entity && this.entity) {
      this.changesSubscription?.unsubscribe();
      this.changesSubscription = this.entityMapper
        .receiveUpdates(this.entity.getConstructor())
        .pipe(
          filter(({ entity }) => entity.getId() === this.entity.getId()),
          filter(({ type }) => type !== "remove"),
          untilDestroyed(this)
        )
        .subscribe(({ entity }) => this.applyChanges(entity));
    }
    if (changes.form && this.form) {
      this.initialFormValues = this.form.getRawValue();
    }
  }

  private async applyChanges(entity: T) {
    if (this.formIsUpToDate(entity)) {
      Object.assign(this.entity, entity as any);
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
      this.form.patchValue(entity as any);
      Object.assign(this.entity, entity as any);
    }
  }

  private changesOnlyAffectPristineFields(updatedEntity: T) {
    if (this.form.pristine) {
      return true;
    }

    const dirtyFields = Object.entries(this.form.controls).filter(
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
    return Object.entries(this.form.getRawValue()).every(([key, value]) =>
      this.entityEqualsFormValue(entity[key], value)
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
