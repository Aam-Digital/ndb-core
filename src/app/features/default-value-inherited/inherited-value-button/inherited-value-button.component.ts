import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from "@angular/core";
import { EntityForm } from "../../../core/common-components/entity-form/entity-form.service";
import { EntityFieldLabelComponent } from "../../../core/common-components/entity-field-label/entity-field-label.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { TemplateTooltipDirective } from "../../../core/common-components/template-tooltip/template-tooltip.directive";
import { Entity } from "../../../core/entity/model/entity";
import {
  DefaultValueHint,
  DefaultValueService,
} from "../../../core/default-values/default-value-service/default-value.service";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { MatIconButton } from "@angular/material/button";

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
