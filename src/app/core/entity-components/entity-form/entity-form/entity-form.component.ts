import { Component, Input, ViewEncapsulation } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { FormFieldConfig } from "./FormConfig";
import { EntityForm } from "../entity-form.service";

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
export class EntityFormComponent {
  /**
   * The entity which should be displayed and edited
   */
  @Input() entity: Entity;

  @Input() columns: FormFieldConfig[][];

  @Input() columnHeaders?: (string | null)[];

  @Input() form: EntityForm<Entity>;
}
