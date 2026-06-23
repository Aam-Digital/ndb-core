import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { ReactiveFormsModule } from "@angular/forms";
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
import {
  ConfigurableEnum,
  InvalidEnumOptionException,
} from "../configurable-enum";
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
  implements OnInit, EditComponent
{
  formFieldConfig = input<FormFieldConfig>();
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly enumRefreshTick = signal(0);
  private readonly formControlValue = signal<
    ConfigurableEnumValue | ConfigurableEnumValue[] | undefined
  >(undefined);

  readonly multi = computed(() => this.formFieldConfig()?.isArray ?? false);
  readonly enumId = computed(() => this.formFieldConfig()?.additional);
  readonly enumEntity = computed<ConfigurableEnum | undefined>(() => {
    this.enumRefreshTick();
    const enumId = this.enumId();
    return enumId ? this.enumService.getEnum(enumId) : undefined;
  });
  readonly canEdit = computed(() => {
    this.enumId();
    const enumEntity = this.enumEntity();
    return !!enumEntity && this.ability.can("update", enumEntity);
  });
  enumValueToString = (v: ConfigurableEnumValue) => v?.label;
  readonly createNewOption = computed<
    ((input: string) => Promise<ConfigurableEnumValue | undefined>) | undefined
  >(() => (this.canEdit() ? this.addNewOption.bind(this) : undefined));
  readonly invalidOptions = computed<ConfigurableEnumValue[]>(() => {
    const value = this.formControlValue();
    if (!value) {
      return [];
    }
    if (
      !this.multi() &&
      !Array.isArray(value) &&
      (value as any).isInvalidOption
    ) {
      return [value];
    }
    if (this.multi() && Array.isArray(value)) {
      return value.filter((option) => (option as any).isInvalidOption);
    }
    return [];
  });
  readonly options = computed<ConfigurableEnumValue[]>(() => {
    this.enumRefreshTick();
    return [...(this.enumEntity()?.values ?? []), ...this.invalidOptions()];
  });

  ngOnInit() {
    if (this.formControl) {
      this.formControlValue.set(this.formControl.value);
      this.formControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((value) => this.formControlValue.set(value));
    }
  }

  async addNewOption(name: string) {
    const enumEntity = this.enumEntity();
    if (!enumEntity) {
      return undefined;
    }

    const prevValues = JSON.stringify(enumEntity.values);
    let addedOption: ConfigurableEnumValue;

    try {
      addedOption = enumEntity.addOption(name);
    } catch (error) {
      const message =
        error instanceof InvalidEnumOptionException
          ? $localize`Couldn't create the option "${name}" because it doesn't contain any usable characters for an ID, please include some letters or numbers. You can rename options more freely afterwards.`
          : $localize`Couldn't create this new option. Please check if the value already exists.`;
      await this.confirmation.getConfirmation(
        $localize`Failed to create new option`,
        message,
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
      enumEntity.values = JSON.parse(prevValues);
      return undefined;
    }

    await this.entityMapper.save(enumEntity);
    this.enumRefreshTick.update((version) => version + 1);
    return addedOption;
  }

  openSettings(event: Event) {
    event.stopPropagation();
    const enumEntity = this.enumEntity();
    if (!enumEntity) {
      return;
    }

    this.dialog
      .open(ConfigureEnumPopupComponent, { data: enumEntity })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.enumRefreshTick.update((version) => version + 1);
        this.reconcileSingleSelectedValue();
      });
  }

  private reconcileSingleSelectedValue() {
    const value = this.formControl.value;
    const enumEntity = this.enumEntity();

    if (
      this.multi() ||
      !value ||
      Array.isArray(value) ||
      (value as any).isInvalidOption ||
      !enumEntity
    ) {
      return;
    }

    if (!enumEntity.values.some((enumValue) => enumValue.id === value.id)) {
      this.formControl.setValue(undefined);
    }
  }

  override onContainerClick(event: MouseEvent) {
    this.autocompleteComponent?.onContainerClick(event);
  }
}
