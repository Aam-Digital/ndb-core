import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { HelpButtonComponent } from "../help-button/help-button.component";
import { Entity } from "../../entity/model/entity";
import {
  EntityForm,
  EntityFormService,
} from "../entity-form/entity-form.service";
import { ColumnConfig, FormFieldConfig } from "../entity-form/FormConfig";
import { NgIf } from "@angular/common";
import { EntityFieldViewComponent } from "../entity-field-view/entity-field-view.component";
import { MatHint } from "@angular/material/form-field";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatIconButton } from "@angular/material/button";
import { EntityFieldLabelComponent } from "../entity-field-label/entity-field-label.component";
import {
  DefaultValueHint,
  DefaultValueService,
} from "../../default-values/default-value.service";

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
  standalone: true,
  imports: [
    DynamicComponentDirective,
    HelpButtonComponent,
    NgIf,
    EntityFieldViewComponent,
    MatHint,
    FaIconComponent,
    MatIconButton,
    EntityFieldLabelComponent,
  ],
})
export class EntityFieldEditComponent<T extends Entity = Entity>
  implements OnChanges
{
  /** field id or full config */
  @Input() field: ColumnConfig;
  /** full field config extended from schema (used internally and for template) */
  _field: FormFieldConfig;

  @Input() entity: T;
  @Input() form: EntityForm<T>;

  /**
   * Whether to display the field in a limited space, hiding details like the help description button.
   */
  @Input() compactMode: boolean;

  defaultValueHint: DefaultValueHint | undefined;

  constructor(
    private entityFormService: EntityFormService,
    private defaultValueService: DefaultValueService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.field || changes.entity) {
      this.updateField();
    }

    this.defaultValueHint = this.defaultValueService.getDefaultValueUiHint(
      this.form,
      this._field?.id,
    );
    if (changes.form && changes.form.firstChange) {
      this.form?.formGroup.valueChanges.subscribe((value) =>
        // ensure this is only called after the other changes handler
        setTimeout(
          () =>
            (this.defaultValueHint =
              this.defaultValueService.getDefaultValueUiHint(
                this.form,
                this._field?.id,
              )),
        ),
      );
    }
  }

  private updateField() {
    if (!this.entity?.getConstructor()) {
      this._field = undefined;
      return;
    }

    this._field = this.entityFormService.extendFormFieldConfig(
      this.field,
      this.entity.getConstructor(),
    );
  }
}
