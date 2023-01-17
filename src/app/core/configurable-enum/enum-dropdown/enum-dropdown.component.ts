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
  enumValueToString = (v: ConfigurableEnumValue) => v?.label;
  createNewOption = (name: string) => {
    const option = { id: name, label: name };
    this.options.push(option);
    this.enumEntity.values.push(option);
    this.entityMapper.save(this.enumEntity);
    return option;
  };

  constructor(
    private enumService: ConfigurableEnumService,
    private entityMapper: EntityMapperService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("enumId")) {
      this.enumEntity = this.enumService.getEnum(this.enumId);
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
}
