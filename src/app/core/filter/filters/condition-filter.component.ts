import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  BasicAutocompleteComponent,
} from "app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { MatFormFieldControl } from "@angular/material/form-field";

@Component({
  selector: "app-conditional-filter",
  standalone: true,
  imports: BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  providers: [
    { provide: MatFormFieldControl, useExisting: ConditionFilterComponent },
  ],
  templateUrl:
    "../../common-components/basic-autocomplete/basic-autocomplete.component.html",
})
export class ConditionFilterComponent extends BasicAutocompleteComponent<string> {
  @Input() override multi = false;
  @Input() override placeholder =
    $localize`:ConditionFilter placeholder:Select Condition`;
    private conditionMappings: Record<string, string> = {
      "Equals": "$eq",
      "Greater Than": "$gt",
      "Less Than": "$lt",
      "Regex Match": "$regex",
    };

    override ngOnInit(): void {
      this.options = Object.keys(this.conditionMappings);
      super.ngOnInit();
    }
  
    override optionToString = (option: string): string => option;
  
    override valueMapper = (value: string): string => {
      return this.conditionMappings[value] || value;
    };
}
