import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";

export type ConditionCombinator = "any" | "all";

/**
 * Toggle to choose whether a list of conditions must ALL match ("and"/"all")
 * or whether matching ANY ONE of them is sufficient ("or"/"any").
 *
 * Used wherever a user configures a list of Mango-query condition rows,
 * e.g. permission conditions or a field's `displayCondition`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-condition-combinator-toggle",
  imports: [MatButtonToggleModule, MatTooltipModule],
  templateUrl: "./condition-combinator-toggle.component.html",
})
export class ConditionCombinatorToggleComponent {
  readonly value = input.required<ConditionCombinator>();
  readonly valueChange = output<ConditionCombinator>();
}
