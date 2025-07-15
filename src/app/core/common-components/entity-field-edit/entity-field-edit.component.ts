import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from "@angular/core";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { HelpButtonComponent } from "../help-button/help-button.component";
import { Entity } from "../../entity/model/entity";
import {
  EntityForm,
  EntityFormService,
} from "../entity-form/entity-form.service";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../entity-form/FormConfig";
import { NgClass } from "@angular/common";
import { EntityFieldViewComponent } from "../entity-field-view/entity-field-view.component";
import { InheritedValueButtonComponent } from "../../../features/default-value-inherited/inherited-value-button/inherited-value-button.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";

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
    DynamicComponentDirective,
    HelpButtonComponent,
    EntityFieldViewComponent,
    InheritedValueButtonComponent,
    NgClass,
    FontAwesomeModule,
    MatButtonModule,
    MatTooltipModule,
  ],
})
export class EntityFieldEditComponent<T extends Entity = Entity>
  implements OnChanges
{
  private entityFormService = inject(EntityFormService);
  private entitySchemaService = inject(EntitySchemaService);

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

  /**
   * Whether to display the field label or not.
   */
  @Input() hideLabel: boolean;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.field || changes.entity) {
      this.updateField();
    }
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
