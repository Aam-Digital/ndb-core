import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { InheritedValueButtonComponent } from "../../../features/inherited-field/inherited-value-button/inherited-value-button.component";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../../common-components/entity-form/FormConfig";
import { ErrorHintComponent } from "../../common-components/error-hint/error-hint.component";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { EntityFieldViewComponent } from "../entity-field-view/entity-field-view.component";
import { Entity } from "../model/entity";
import { DynamicEditComponent } from "./dynamic-edit/dynamic-edit.component";

/**
 * Generic component to display one entity property field's editComponent.
 *
 * Dynamically extends field details from entity schema and
 * loads the relevant, specific EditComponent implementation.
 *
 * For viewComponent of a field, see EntityFieldViewComponent.
 */
@Component({
  selector: "app-entity-field-edit",
  templateUrl: "./entity-field-edit.component.html",
  styleUrls: ["./entity-field-edit.component.scss"],
  imports: [
    HelpButtonComponent,
    EntityFieldViewComponent,
    InheritedValueButtonComponent,
    FontAwesomeModule,
    MatButtonModule,
    MatTooltipModule,
    DynamicEditComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    ErrorHintComponent,
  ],
})
export class EntityFieldEditComponent<
  T extends Entity = Entity,
> implements OnChanges {
  private entityFormService = inject(EntityFormService);
  private entitySchemaService = inject(EntitySchemaService);

  /** field id or full config */
  @Input() field: ColumnConfig;
  /** full field config extended from schema (used internally and for template) */
  _field: FormFieldConfig;

  /**
   * The FormControl of this field
   */
  formControl: FormControl;

  @Input() entity: T;
  @Input() form: EntityForm<T>;

  /**
   * Whether to display the field in a limited space, hiding details like the help description button.
   */
  @Input() compactMode: boolean;

  /**
   * Whether to display the field label or not.
   */
  @Input() hideLabel: boolean;

  /**
   * Whether to hide the inherit value button for inherited-field default values.
   */
  @Input() hideInheritButton: boolean = false;

  isPartiallyAnonymized: boolean;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.field || changes.entity) {
      this.updateField();
    }

    if (this.form && this._field) {
      this.formControl = this.form.formGroup.get(this._field.id) as FormControl;
    }

    this.isPartiallyAnonymized =
      this.entity?.anonymized &&
      this.entity?.getSchema()?.get(this._field?.id)?.anonymize ===
        "retain-anonymized";
  }

  private updateField() {
    if (!this.field) {
      this._field = undefined;
      return;
    }

    if (this.entity?.getConstructor()) {
      this._field = this.entityFormService.extendFormFieldConfig(
        this.field,
        this.entity.getConstructor(),
      );
    } else {
      this._field = toFormFieldConfig(this.field);
      // add editComponent (because we cannot rely on the entity's schema yet for a new field)
      this._field.editComponent =
        this._field.editComponent ??
        this.entitySchemaService.getComponent(this._field, "edit");
    }
  }
}
