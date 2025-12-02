import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "../../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { ConfigurableEnum } from "../configurable-enum";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { ConfigurableEnumValue } from "../configurable-enum.types";
import { ConfigureEnumPopupComponent } from "../configure-enum-popup/configure-enum-popup.component";
import { DisplayConfigurableEnumComponent } from "../display-configurable-enum/display-configurable-enum.component";

@DynamicComponent("EditConfigurableEnum")
@Component({
  selector: "app-edit-configurable-enum",
  templateUrl: "./edit-configurable-enum.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: [
    "./edit-configurable-enum.component.scss",
    "../../../common-components/basic-autocomplete/basic-autocomplete-dropdown.component.scss",
  ],
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    BasicAutocompleteComponent,
    FontAwesomeModule,
    MatButtonModule,
    DisplayConfigurableEnumComponent,
  ],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditConfigurableEnumComponent,
    },
  ],
})
export class EditConfigurableEnumComponent
  extends CustomFormControlDirective<
    ConfigurableEnumValue | ConfigurableEnumValue[]
  >
  implements OnInit, OnChanges, EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;
  @ViewChild(BasicAutocompleteComponent)
  autocompleteComponent: BasicAutocompleteComponent<
    ConfigurableEnumValue,
    ConfigurableEnumValue
  >;

  private readonly enumService = inject(ConfigurableEnumService);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly ability = inject(EntityAbility);
  private readonly dialog = inject(MatDialog);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  enumId: string;
  multi = false;

  enumEntity: ConfigurableEnum;
  invalidOptions: ConfigurableEnumValue[] = [];
  options: ConfigurableEnumValue[] = [];
  canEdit = false;
  enumValueToString = (v: ConfigurableEnumValue) => v?.label;
  createNewOption: (input: string) => Promise<ConfigurableEnumValue>;

  get formControl(): FormControl<
    ConfigurableEnumValue | ConfigurableEnumValue[]
  > {
    return this.ngControl?.control as FormControl<
      ConfigurableEnumValue | ConfigurableEnumValue[]
    >;
  }

  ngOnInit() {
    this.multi = this.formFieldConfig?.isArray ?? false;
    this.enumId = this.formFieldConfig?.additional;
    this.updateEnumData();
    this.updateInvalidOptions();

    // Subscribe to value changes to trigger change detection
    if (this.formControl) {
      this.formControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.changeDetector.markForCheck();
        });
    }
  }

  ngOnChanges(): void {
    this.updateInvalidOptions();
  }

  private updateInvalidOptions(): void {
    this.invalidOptions = this.prepareInvalidOptions();
    this.options = [...(this.enumEntity?.values ?? []), ...this.invalidOptions];
    this.changeDetector.markForCheck();
  }

  private updateEnumData(): void {
    this.enumEntity = this.enumService.getEnum(this.enumId);
    this.canEdit = this.ability.can("update", this.enumEntity);
    if (this.canEdit) {
      this.createNewOption = this.addNewOption.bind(this);
    }
  }

  private prepareInvalidOptions(): ConfigurableEnumValue[] {
    if (!this.formControl) {
      return [];
    }

    let additionalOptions;
    const value = this.formControl.value;

    if (
      !this.multi &&
      value &&
      !Array.isArray(value) &&
      (value as any).isInvalidOption
    ) {
      additionalOptions = [value];
    }
    if (this.multi && Array.isArray(value)) {
      additionalOptions = value?.filter((o) => (o as any).isInvalidOption);
    }
    return additionalOptions ?? [];
  }

  async addNewOption(name: string) {
    const prevValues = JSON.stringify(this.enumEntity.values);
    let addedOption: ConfigurableEnumValue;

    try {
      addedOption = this.enumEntity.addOption(name);
    } catch (error) {
      await this.confirmation.getConfirmation(
        $localize`Failed to create new option`,
        $localize`Couldn't create this new option. Please check if the value already exists.`,
        OkButton,
      );
      return undefined;
    }

    if (!addedOption) {
      return undefined;
    }

    const userConfirmed = await this.confirmation.getConfirmation(
      $localize`Create new option`,
      $localize`Do you want to create the new option "${addedOption.label}"?`,
    );
    if (!userConfirmed) {
      this.enumEntity.values = JSON.parse(prevValues);
      return undefined;
    }

    await this.entityMapper.save(this.enumEntity);
    return addedOption;
  }

  openSettings(event: Event) {
    event.stopPropagation();

    this.dialog
      .open(ConfigureEnumPopupComponent, { data: this.enumEntity })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateOptions());
  }

  private updateOptions() {
    const value = this.formControl.value;

    if (
      value &&
      !Array.isArray(value) &&
      // value not in options anymore
      !this.enumEntity.values.some((v) => v.id === value.id) &&
      // but was in options previously
      this.options.some((v) => v.id === value.id)
    ) {
      this.formControl.setValue(undefined);
    }

    this.options = [...(this.enumEntity?.values ?? []), ...this.invalidOptions];
    this.changeDetector.markForCheck();
  }

  override onContainerClick(event: MouseEvent) {
    this.autocompleteComponent?.onContainerClick(event);
  }
}
