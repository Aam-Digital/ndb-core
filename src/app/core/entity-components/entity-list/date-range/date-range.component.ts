import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { DaterangeHeaderComponent } from "./daterange-header/daterange-header.component";

@Component({
  selector: "app-date-range",
  templateUrl: "./date-range.component.html",
  styleUrls: ["./date-range.component.scss"],
})
export class DateRangeComponent implements OnInit {
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  readonly DaterangeHeaderComponent = DaterangeHeaderComponent;
  fromDate: Date;
  toDate: Date;

  constructor() {}

  ngOnInit(): void {}

  apply() {}
}
