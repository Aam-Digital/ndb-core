import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { environment } from "#src/environments/environment";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { CustomFormControlDirective } from "../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { FaDynamicIconComponent } from "../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { FeatureDisabledInfoComponent } from "../../common-components/feature-disabled-info/feature-disabled-info.component";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.types";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { availableLocales } from "../languages";
import { EditComponent } from "../../entity/entity-field-edit/dynamic-edit/edit-component.interface";

/**
 * Edit component for the enabled languages of a system (site settings `availableLocales`).
 *
 * Only available if the system is set up as multi-language (`multiLingualConfigEnabled`),
 * otherwise it points to that feature being disabled.
 * The system language (`defaultLanguage` in the same form) always stays in the list,
 * because it is always enabled (also if nothing else is selected). It is marked among the options.
 */
@DynamicComponent("EditAvailableLocales")
@Component({
  selector: "app-edit-available-locales",
  templateUrl: "./edit-available-locales.component.html",
  styleUrl: "./edit-available-locales.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    BasicAutocompleteComponent,
    MatTooltipModule,
    FeatureDisabledInfoComponent,
    FaDynamicIconComponent,
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

  private readonly autocomplete = viewChild(BasicAutocompleteComponent);

  /** all selectable locales (not user-editable, so no "create option") */
  readonly options: ConfigurableEnumValue[] = availableLocales.values;
  readonly localeToString = (locale: ConfigurableEnumValue) => locale?.label;

  readonly multiLingualConfigEnabled = environment.multiLingualConfigEnabled;

  /** the system language, which cannot be removed from the enabled languages */
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

  /**
   * Make sure the system language is part of the list, also an empty one
   * (the enabled languages are the system language plus the selection).
   * It is appended, matching the order of `SiteSettingsService.enabledLocales`.
   */
  private keepSystemLanguage() {
    const systemLanguage = this.systemLanguage();
    const enabled: ConfigurableEnumValue[] = this.formControl.value ?? [];
    if (
      !systemLanguage?.id ||
      enabled.some(({ id }) => id === systemLanguage.id)
    ) {
      return;
    }
    this.formControl.setValue([...enabled, systemLanguage]);
  }

  /**
   * Open the options when clicking anywhere in the field.
   * Bound to the click of the autocomplete in the template: the surrounding `mat-form-field`
   * only calls `onContainerClick` of its direct control (the generic dynamic-edit wrapper,
   * where it is a no-op), so it never reaches this component.
   */
  override onContainerClick(event: MouseEvent) {
    this.autocomplete()?.onContainerClick(event);
  }
}
