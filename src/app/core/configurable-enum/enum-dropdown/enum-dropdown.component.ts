import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ConfigurableEnumDirective } from "../configurable-enum-directive/configurable-enum.directive";
import { NgForOf, NgIf } from "@angular/common";
import { ConfigurableEnumValue } from "../configurable-enum.interface";
import { BasicAutocompleteComponent } from "../basic-autocomplete/basic-autocomplete.component";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { ConfigurableEnum } from "../configurable-enum";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { MatDialog } from "@angular/material/dialog";
import { ConfigureEnumPopupComponent } from "../configure-enum-popup/configure-enum-popup.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ErrorHintComponent } from "../../entity-components/entity-utils/error-hint/error-hint.component";

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
  ],
})
export class EnumDropdownComponent implements OnChanges {
  @Input() form: FormControl; // cannot be named "formControl" - otherwise the angular directive grabs this
  @Input() label: string;
  @Input() enumId: string;
  @Input() multi = false;

  enumEntity: ConfigurableEnum;
  invalidOptions: ConfigurableEnumValue[] = [];
  options: ConfigurableEnumValue[];
  canEdit = false;
  enumValueToString = (v: ConfigurableEnumValue) => v?.label;
  createNewOption: (input: string) => ConfigurableEnumValue;

  constructor(
    private enumService: ConfigurableEnumService,
    private entityMapper: EntityMapperService,
    private ability: EntityAbility,
    private dialog: MatDialog,
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
    this.options = [...this.enumEntity.values, ...this.invalidOptions];
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

  private addNewOption(name: string) {
    const option = { id: name, label: name };
    this.enumEntity.values.push(option);
    this.entityMapper.save(this.enumEntity);
    return option;
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
      // value not in options anymore
      !this.enumEntity.values.some((v) => v.id === this.form.value.id) &&
      // but was in options previously
      this.options.some((v) => v.id === this.form.value.id)
    ) {
      this.form.setValue(undefined);
    }

    this.options = [...this.enumEntity.values, ...this.invalidOptions];
  }
}
