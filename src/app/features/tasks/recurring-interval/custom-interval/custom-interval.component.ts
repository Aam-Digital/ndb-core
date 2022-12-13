import { Component } from "@angular/core";
import {timeUnitsPrimary} from "../time-interval";

@Component({
  selector: "app-custom-interval",
  templateUrl: "./custom-interval.component.html",
  styleUrls: ["./custom-interval.component.scss"],
})
export class CustomIntervalComponent {
  availableUnits: { label: string; unit: string }[] = timeUnitsPrimary;

  selectedValue: number = 1;
  selectedUnit: string = "weeks";
}
