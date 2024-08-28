import { Component } from "@angular/core";
import { ViewDirective } from "app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";
import { DisplayPercentageComponent } from "../display-percentage/display-percentage.component";
import { NgStyle } from "@angular/common";

/**
 * Dynamically calculate a value based on values of given fields of the entity as configured.
 */
@DynamicComponent("DisplayDynamicPercentage")
@DynamicComponent("DisplayCalculatedValue")
@Component({
  selector: "app-display-calculated-value",
  templateUrl: "./display-calculated-value.component.html",
  styleUrls: ["./display-calculated-value.component.scss"],
  standalone: true,
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
  calculationType: CalculationType;

  /**
   * "calculated" color for special calculation types
   */
  color: string;

  /**
   * dynamically calculate the value based on configured entity fields.
   * This is defined as a function to re-calculate on every change detection cycle as the value remains outdated otherwise.
   */
  calculateValue() {
    if (!this.calculationType) {
      this.calculationType =
        this.config.calculation ?? CalculationType.Percentage;
    }

    let value: number;
    switch (this.calculationType) {
      case CalculationType.Percentage:
        value = this._percentage();
        break;
      case CalculationType.BMI:
        value = this._bmi();
        this.color = this._bmiColor(value);
        break;
    }

    return value;
  }

  private _percentage(): number {
    const actual: number =
      this.entity[this.config.valueFields?.[0] ?? this.config.actual];
    const total: number =
      this.entity[this.config.valueFields?.[1] ?? this.config.total];

    if (Number.isFinite(actual) && Number.isFinite(total) && total != 0) {
      return (actual / total) * 100;
    }
  }

  private _bmi(): number {
    const weight: number = this.entity[this.config.valueFields[0]];
    const height: number = this.entity[this.config.valueFields[1]];

    const bmi = weight / ((height / 100) * (height / 100));
    return Math.round(bmi * 100) / 100;
  }
  private _bmiColor(bmi: number) {
    if (Number.isNaN(bmi) || !Number.isFinite(bmi)) {
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
