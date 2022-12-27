import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { FormFieldConfig } from "./FormConfig";
import { EntityForm } from "../entity-form.service";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { filter } from "rxjs/operators";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";

/**
 * A general purpose form component for displaying and editing entities.
 * It uses the FormFieldConfig interface for building the form fields but missing information are also fetched from
 * the entity's schema definitions. Properties with sufficient schema information can be displayed by only providing
 * the name of this property (and not an FormFieldConfig object).
 *
 * This component can be used directly or in a popup.
 * Inside the entity details component use the FormComponent which is registered as dynamic component.
 */
@Component({
  selector: "app-entity-form",
  templateUrl: "./entity-form.component.html",
  styleUrls: ["./entity-form.component.scss"],
  // Use no encapsulation because we want to change the value of children (the mat-form-fields that are
  // dynamically created)
  encapsulation: ViewEncapsulation.None,
})
export class EntityFormComponent implements OnInit {
  /**
   * The entity which should be displayed and edited
   */
  @Input() entity: Entity;

  @Input() columns: FormFieldConfig[][];

  @Input() columnHeaders?: (string | null)[];

  @Input() form: EntityForm<Entity>;

  constructor(
    private entityMapper: EntityMapperService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit() {
    this.entityMapper
      .receiveUpdates(this.entity.getConstructor())
      .pipe(filter(({ entity }) => entity.getId() === this.entity.getId()))
      .subscribe(({ entity }) => this.applyChanges(entity));
  }

  private async applyChanges(entity) {
    if (this.formIsUpToDate(entity)) {
      // this is the component that currently saves the values -> no need to apply changes.
      return;
    }
    if (
      this.form.pristine ||
      (await this.confirmationDialog.getConfirmation(
        $localize`Load changes?`,
        $localize`Local changes are in conflict with updated values synced from the server. Do you want the local changes to be overwritten with the latest values?`
      ))
    ) {
      this.form.patchValue(entity as any);
      this.form.markAsPristine();
    }
  }

  private formIsUpToDate(entity: Entity): boolean {
    return Object.entries(this.form.getRawValue()).every(([key, value]) => {
      return (
        (entity[key] === undefined && value === null) ||
        entity[key] === value ||
        JSON.stringify(entity[key]) === JSON.stringify(value)
      );
    });
  }
}
