import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { FormFieldConfig } from "./FormConfig";
import { EntityForm, EntityFormService } from "../entity-form.service";
import { AlertService } from "../../../alerts/alert.service";
import { InvalidFormFieldError } from "../invalid-form-field.error";
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
export class EntityFormComponent<T extends Entity = Entity> implements OnInit {
  /**
   * The entity which should be displayed and edited
   */
  @Input() entity: T;

  /**
   * The form field definitions. Either as a string or as a FormFieldConfig object.
   * Missing information will be fetched from the entity schema definition.
   * @param columns The columns which should be displayed
   */
  @Input() set columns(columns: (FormFieldConfig | string)[][]) {
    this._columns = columns.map((row) =>
      row.map((field) => {
        if (typeof field === "string") {
          return { id: field };
        } else {
          return field;
        }
      })
    );
  }

  _columns: FormFieldConfig[][] = [];

  @Input() columnHeaders?: (string | null)[];

  @Output() formReady = new EventEmitter<EntityForm<T>>();

  form: EntityForm<T>;

  constructor(private entityFormService: EntityFormService) {}

  ngOnInit() {
    // TODO move to FormComponent
    const flattenedFormFields = new Array<FormFieldConfig>().concat(
      ...this._columns
    );
    this.entityFormService.extendFormFieldConfig(
      flattenedFormFields,
      this.entity.getConstructor()
    );
    this.form = this.entityFormService.createFormGroup(
      flattenedFormFields,
      this.entity
    );
    this.formReady.emit(this.form);
  }
}
