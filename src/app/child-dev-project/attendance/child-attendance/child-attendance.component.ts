import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { AttendanceMonth } from "../model/attendance-month";
import { ChildrenService } from "../../children/children.service";
import { DatePipe, PercentPipe } from "@angular/common";
import { AttendanceDetailsComponent } from "../attendance-details/attendance-details.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Child } from "../../children/model/child";
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";

@UntilDestroy()
@Component({
  selector: "app-child-attendance",
  templateUrl: "./child-attendance.component.html",
})
export class ChildAttendanceComponent implements OnChanges {
  @Input() institution: string;
  @Input() showDailyAttendanceOfLatest = false;
  @Input() child: Child;

  records: Array<AttendanceMonth>;
  detailsComponent = AttendanceDetailsComponent;

  columns: Array<ColumnDescription> = [
    {
      name: "month",
      label: "Month",
      inputType: ColumnDescriptionInputType.MONTH,
      formatter: (v: Date) => this.datePipe.transform(v, "yyyy-MM"),
      visibleFrom: "xs",
    },
    {
      name: "daysAttended",
      label: "Present",
      inputType: ColumnDescriptionInputType.NUMBER,
      visibleFrom: "xs",
    },
    {
      name: "daysWorking",
      label: "Working Days",
      inputType: ColumnDescriptionInputType.NUMBER,
      visibleFrom: "xs",
    },
    {
      name: "getAttendancePercentage",
      label: "Attended",
      inputType: ColumnDescriptionInputType.FUNCTION,
      formatter: (v: number) => this.percentPipe.transform(v, "1.0-0"),
      visibleFrom: "md",
      valueFunction: (entity: AttendanceMonth) =>
        entity.getAttendancePercentage(),
    },
    {
      name: "daysExcused",
      label: "Excused",
      inputType: ColumnDescriptionInputType.NUMBER,
      visibleFrom: "md",
    },
    {
      name: "remarks",
      label: "Remarks",
      inputType: ColumnDescriptionInputType.TEXTAREA,
      visibleFrom: "xl",
    },
  ];

  constructor(
    private childrenService: ChildrenService,
    private datePipe: DatePipe,
    private percentPipe: PercentPipe
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("child")) {
      this.loadData(this.child.getId());
    }
  }

  loadData(id: string) {
    this.childrenService
      .getAttendancesOfChild(id)
      .pipe(untilDestroyed(this))
      .subscribe((results) => {
        this.records = results
          .filter(
            (r) =>
              this.institution === undefined ||
              r.institution === this.institution
          )
          .sort(
            (a, b) =>
              (b.month ? b.month.valueOf() : 0) -
              (a.month ? a.month.valueOf() : 0)
          );

        if (this.showDailyAttendanceOfLatest) {
          this.createCurrentMonthsAttendanceIfNotExists();
        }
      });
  }

  private createCurrentMonthsAttendanceIfNotExists() {
    const now = new Date();
    if (
      this.records.length === 0 ||
      this.records[0].month.getFullYear() !== now.getFullYear() ||
      this.records[0].month.getMonth() !== now.getMonth()
    ) {
      this.records.unshift(
        AttendanceMonth.createAttendanceMonth(
          this.child.getId(),
          this.institution
        )
      );
    }
  }

  generateNewRecordFactory() {
    // define values locally because 'this' is a different scope after passing a function as input to another component
    const child = this.child.getId();
    const institution = this.institution;

    return () => {
      return AttendanceMonth.createAttendanceMonth(child, institution);
    };
  }
}
