import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ConfigurableEnumDirective } from "../configurable-enum-directive/configurable-enum.directive";
import { NgForOf, NgIf } from "@angular/common";
import { ConfigurableEnumValue } from "../configurable-enum.interface";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { ConfigurableEnum } from "../configurable-enum";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { MatDialog } from "@angular/material/dialog";
import { ConfigureEnumPopupComponent } from "../configure-enum-popup/configure-enum-popup.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
import { MatButtonModule } from "@angular/material/button";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "../../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";

@Component({
  selector: "app-enum-dropdown",
  templateUrl: "./enum-dropdown.component.html",
  styleUrls: ["./enum-dropdown.component.scss"],
  standalone: true,
  imports: [
    MatSelectModule,
    ReactiveFormsModule,
    ConfigurableEnumDirective,
    NgIf,
    NgForOf,
    BasicAutocompleteComponent,
    FontAwesomeModule,
    ErrorHintComponent,
    MatButtonModule,
  ],
})
export class EnumDropdownComponent implements OnChanges {
  @Input() form: FormControl; // cannot be named "formControl" - otherwise the angular directive grabs this
  @Input() label: string;
  @Input() enumId: string;
  @Input() multi = false;

  enumEntity: ConfigurableEnum;
  invalidOptions: ConfigurableEnumValue[] = [];
  options: ConfigurableEnumValue[] = [];
  canEdit = false;
  enumValueToString = (v: ConfigurableEnumValue) => v?.label;
  createNewOption: (input: string) => Promise<ConfigurableEnumValue>;

  constructor(
    private enumService: ConfigurableEnumService,
    private entityMapper: EntityMapperService,
    private ability: EntityAbility,
    private dialog: MatDialog,
    private confirmation: ConfirmationDialogService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("enumId")) {
      this.enumEntity = this.enumService.getEnum(this.enumId);
      this.canEdit = this.ability.can("update", this.enumEntity);
      if (this.canEdit) {
        this.createNewOption = this.addNewOption.bind(this);
      }
    }
    if (changes.hasOwnProperty("enumId") || changes.hasOwnProperty("form")) {
      this.invalidOptions = this.prepareInvalidOptions();
    }
    this.options = [...(this.enumEntity?.values ?? []), ...this.invalidOptions];
  }

  private prepareInvalidOptions(): ConfigurableEnumValue[] {
    let additionalOptions;
    if (!this.multi && this.form.value?.isInvalidOption) {
      additionalOptions = [this.form.value];
    }
    if (this.multi) {
      additionalOptions = this.form.value?.filter((o) => o.isInvalidOption);
    }
    return additionalOptions ?? [];
  }

  private async addNewOption(name: string) {
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
      .subscribe(() => this.updateOptions());
  }

  private updateOptions() {
    if (
      this.form.value &&
      // value not in options anymore
      !this.enumEntity.values.some((v) => v.id === this.form.value.id) &&
      // but was in options previously
      this.options.some((v) => v.id === this.form.value.id)
    ) {
      this.form.setValue(undefined);
    }

    this.options = [...(this.enumEntity?.values ?? []), ...this.invalidOptions];
  }
}
