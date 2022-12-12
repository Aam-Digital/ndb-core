import { Component } from "@angular/core";

@Component({
  selector: "app-custom-interval",
  templateUrl: "./custom-interval.component.html",
  styleUrls: ["./custom-interval.component.scss"],
})
export class CustomIntervalComponent {
  availableUnits: { label: string; unit: string }[] = [
    { unit: "days", label: $localize`:interval unit:days` },
    { unit: "weeks", label: $localize`:interval unit:weeks` },
    { unit: "months", label: $localize`:interval unit:months` },
    { unit: "years", label: $localize`:interval unit:years` },
  ];

  selectedValue: number = 1;
  selectedUnit: string = "weeks";
}
