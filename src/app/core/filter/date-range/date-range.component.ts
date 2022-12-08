import {
  Component,
  EventEmitter,
  OnInit,
  Optional,
  Output,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import moment from "moment";
import { DaterangeHeaderComponent } from "./daterange-header/daterange-header.component";

@Component({
  selector: "app-date-range",
  templateUrl: "./date-range.component.html",
  styleUrls: ["./date-range.component.scss"],
})
export class DateRangeComponent {
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  readonly DaterangeHeaderComponent = DaterangeHeaderComponent;
  fromDate: Date;
  toDate: Date;
  @Output() dateRangeChange = new EventEmitter<any>();

  constructor(
    @Optional() private dialogRef: MatDialogRef<DateRangeComponent>
  ) {}

  apply() {
    // this.dialogRef.close(this.buildFilter());
    this.dateRangeChange.emit(this.buildFilter());
  }

  buildFilter() {
    const start = moment(this.fromDate);
    const end = moment(this.toDate);
    const startString = start.format("YYYY-MM-DD");
    const endString = end.format("YYYY-MM-DD");
    return { $gte: startString, $lte: endString };
  }
}
