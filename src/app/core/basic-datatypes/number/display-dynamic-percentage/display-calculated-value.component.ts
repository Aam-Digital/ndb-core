import { Component, ChangeDetectionStrategy, computed } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";
import { DisplayPercentageComponent } from "../display-percentage/display-percentage.component";
import { NgStyle } from "@angular/common";

/**
 * Dynamically calculate a value based on values of given fields of the entity as configured.
 */
@DynamicComponent("DisplayDynamicPercentage")
@DynamicComponent("DisplayCalculatedValue")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-calculated-value",
  templateUrl: "./display-calculated-value.component.html",
  styleUrls: ["./display-calculated-value.component.scss"],
  imports: [DisplayPercentageComponent, NgStyle],
})
export class DisplayCalculatedValueComponent extends ViewDirective<
  number,
  {
    calculation?: CalculationType;
    decimalPlaces?: number;

    /**
     * One or more IDs of the entity fields to use for the calculation
     * (depends on calculation type)
     */
    valueFields?: string[];

    /** @deprecated for backward compatibility */
    total?: string;
    /** @deprecated for backward compatibility  */
    actual?: string;
  }
> {
  readonly calculatedValue = computed(() => {
    const calculationType =
      this.config()?.calculation ?? CalculationType.Percentage;

    switch (calculationType) {
      case CalculationType.Percentage:
        return this._percentage();
      case CalculationType.BMI:
        return this._bmi();
      default:
        return undefined;
    }
  });

  readonly color = computed(() => {
    const calculationType =
      this.config()?.calculation ?? CalculationType.Percentage;
    if (calculationType === CalculationType.BMI) {
      return this._bmiColor(this.calculatedValue());
    }
    return undefined;
  });

  private _percentage(): number | undefined {
    const config = this.config();
    const entity = this.entity();
    const actual: number = entity?.[config?.valueFields?.[0] ?? config?.actual];
    const total: number = entity?.[config?.valueFields?.[1] ?? config?.total];

    if (Number.isFinite(actual) && Number.isFinite(total) && total != 0) {
      return (actual / total) * 100;
    }
    return undefined;
  }

  private _bmi(): number {
    const entity = this.entity();
    const config = this.config();
    const weight: number = entity?.[config?.valueFields?.[0]];
    const height: number = entity?.[config?.valueFields?.[1]];

    const bmi = weight / ((height / 100) * (height / 100));
    return Math.round(bmi * 100) / 100;
  }
  private _bmiColor(bmi: number | undefined) {
    if (bmi == undefined || Number.isNaN(bmi) || !Number.isFinite(bmi)) {
      return "#DEDEDE";
    }
    if (bmi <= 16 || bmi >= 30) {
      // critical
      return "rgba(253,114,114,0.4)";
    } else if (bmi >= 18 && bmi <= 25) {
      // healthy
      return "rgba(144,238,144,0.25)";
    } else {
      // not ideal
      return "rgba(255,165,0,0.4)";
    }
  }
}

export enum CalculationType {
  Percentage = "percentage",
  BMI = "bmi",
}
