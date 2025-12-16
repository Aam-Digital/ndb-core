import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { TemplateTooltipDirective } from "../../../core/common-components/template-tooltip/template-tooltip.directive";
import {
  DefaultValueHint,
  DefaultValueService,
} from "../../../core/default-values/default-value-service/default-value.service";
import { EntityFieldLabelComponent } from "../../../core/entity/entity-field-label/entity-field-label.component";
import { Entity } from "../../../core/entity/model/entity";

/**
 * Display an indicator for form fields explaining the status of the inherited-value config of that field
 * and allowing users to re-sync the inherited value manually.
 */
@Component({
  selector: "app-inherited-value-button",
  imports: [
    EntityFieldLabelComponent,
    FaIconComponent,
    TemplateTooltipDirective,
    MatIconButton,
  ],
  templateUrl: "./inherited-value-button.component.html",
  styleUrl: "./inherited-value-button.component.scss",
})
export class InheritedValueButtonComponent implements OnChanges {
  private defaultValueService = inject(DefaultValueService);

  @Input() form: EntityForm<any>;
  @Input() field: FormFieldConfig;
  @Input() entity: Entity;

  defaultValueHint: DefaultValueHint | undefined;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.field.defaultValue?.mode == "inherited-field" &&
      !this.field.defaultValue?.config?.sourceReferenceField
    ) {
      this.defaultValueHint = undefined;
      return;
    }
    this.defaultValueHint = this.defaultValueService.getDefaultValueUiHint(
      this.form,
      this.field?.id,
    );

    if (changes.form && changes.form.firstChange) {
      this.form?.formGroup.valueChanges.subscribe((value) =>
        // ensure this is only called after the other changes handler
        setTimeout(
          () =>
            (this.defaultValueHint =
              this.defaultValueService.getDefaultValueUiHint(
                this.form,
                this.field?.id,
              )),
        ),
      );
    }
  }
}
