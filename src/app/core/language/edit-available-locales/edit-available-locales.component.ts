import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { environment } from "#src/environments/environment";
import { CustomFormControlDirective } from "../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { FeatureDisabledInfoComponent } from "../../common-components/feature-disabled-info/feature-disabled-info.component";
import { EditConfigurableEnumComponent } from "../../basic-datatypes/configurable-enum/edit-configurable-enum/edit-configurable-enum.component";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.types";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../entity/entity-field-edit/dynamic-edit/edit-component.interface";

/**
 * Edit component for the languages a system offers (site settings `availableLocales`).
 *
 * Only available if the system is set up as multi-language (`multiLingualConfigEnabled`),
 * otherwise it points to that feature being disabled.
 * The system language (`defaultLanguage` in the same form) always stays in a
 * non-empty list, because it is always offered.
 */
@DynamicComponent("EditAvailableLocales")
@Component({
  selector: "app-edit-available-locales",
  templateUrl: "./edit-available-locales.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    EditConfigurableEnumComponent,
    FeatureDisabledInfoComponent,
  ],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditAvailableLocalesComponent,
    },
  ],
})
export class EditAvailableLocalesComponent
  extends CustomFormControlDirective<ConfigurableEnumValue[]>
  implements EditComponent, OnInit
{
  formFieldConfig = input<FormFieldConfig>();

  private readonly destroyRef = inject(DestroyRef);

  readonly multiLingualConfigEnabled = environment.multiLingualConfigEnabled;

  /** the system language, which cannot be removed from the offered languages */
  readonly systemLanguage = signal<ConfigurableEnumValue | undefined>(
    undefined,
  );

  ngOnInit() {
    const systemLanguageControl =
      this.formControl?.parent?.get("defaultLanguage");
    if (!this.multiLingualConfigEnabled || !systemLanguageControl) return;

    this.systemLanguage.set(systemLanguageControl.value);
    this.keepSystemLanguage();

    systemLanguageControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.systemLanguage.set(value);
        this.keepSystemLanguage();
      });
    this.formControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.keepSystemLanguage());
  }

  /** An empty list means "all languages", so only a narrowed list is amended. */
  private keepSystemLanguage() {
    const systemLanguage = this.systemLanguage();
    const offered = this.formControl.value;
    if (
      !systemLanguage?.id ||
      !offered?.length ||
      offered.some(({ id }) => id === systemLanguage.id)
    ) {
      return;
    }
    this.formControl.setValue([...offered, systemLanguage]);
  }
}
