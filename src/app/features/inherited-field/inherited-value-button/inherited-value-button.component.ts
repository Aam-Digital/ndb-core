import { EntityForm } from "../../../core/common-components/entity-form/entity-form";
import {
  Component,
  inject,
  ChangeDetectionStrategy,
  effect,
  input,
  signal,
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
import { debounceTime } from "rxjs/operators";

/**
 * Display an indicator for form fields explaining the status of the inherited-value config of that field
 * and allowing users to re-sync the inherited value manually.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class InheritedValueButtonComponent {
  private readonly defaultValueService = inject(DefaultValueService);

  form = input<EntityForm<any>>();
  field = input<FormFieldConfig>();
  entity = input<Entity>();

  defaultValueHint = signal<DefaultValueHint | undefined>(undefined);

  constructor() {
    effect((onCleanup) => {
      const form = this.form();
      const field = this.field();
      if (!form || !field) {
        this.defaultValueHint.set(undefined);
        return;
      }

      if (
        field.defaultValue?.mode == "inherited-field" &&
        !field.defaultValue?.config?.sourceReferenceField
      ) {
        this.defaultValueHint.set(undefined);
        return;
      }

      const updateHint = () => {
        this.defaultValueHint.set(
          this.defaultValueService.getDefaultValueUiHint(form, field.id),
        );
      };
      updateHint();

      let pendingTimeout: ReturnType<typeof setTimeout> | undefined;
      const sub = form.formGroup.valueChanges
        .pipe(debounceTime(50))
        .subscribe(() => {
          // ensure this is only called after the other changes handlers
          pendingTimeout = setTimeout(updateHint);
        });
      onCleanup(() => {
        sub.unsubscribe();
        if (pendingTimeout) {
          clearTimeout(pendingTimeout);
        }
      });
    });
  }
}
