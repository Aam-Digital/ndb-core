import { Component, Input } from "@angular/core";
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
    { provide: MatFormFieldControl, useExisting: ConditionalFilterComponent },
  ],
  templateUrl:
    "../../common-components/basic-autocomplete/basic-autocomplete.component.html",
})
export class ConditionalFilterComponent extends BasicAutocompleteComponent<string> {
  @Input() override multi = false;
  @Input() override placeholder =
    $localize`:ConditionFilter placeholder:Select Condition`;
  private conditionMappings: Record<string, string> = {
    "Equal To": "$eq",
    "Greater Than": "$gt",
    "Greater Than or Equal To": "$gte",
    "Less Than": "$lt",
    "Less Than or Equal To": "$lte",
    "Not Equal To": "$ne",
    "In List": "$in",
    "Not In List": "$nin",
    AND: "$and",
    NOT: "$not",
    Neither: "$nor",
    OR: "$or",
    Exists: "$exists",
    "Has Type": "$type",
    "Where To": "$where",
  };

  override optionToString = (option: string): string => option;

  override valueMapper = (value: string): string => {
    return this.conditionMappings[value] || value;
  };

  override ngOnInit(): void {
    this.options = Object.keys(this.conditionMappings);
    super.ngOnInit();
  }
}
