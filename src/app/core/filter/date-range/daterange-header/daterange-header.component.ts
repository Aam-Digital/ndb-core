import {
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import {
  DateAdapter,
  MatDateFormats,
  MAT_DATE_FORMATS,
} from "@angular/material/core";
import { MatCalendar } from "@angular/material/datepicker";
import { DateRangeFilterConfig } from "app/core/entity-components/entity-list/EntityListConfig";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "app-daterange-header",
  templateUrl: "./daterange-header.component.html",
  styleUrls: ["./daterange-header.component.scss"],
})
export class DaterangeHeaderComponent<D> implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @Input() dateRangeFilterConfig: DateRangeFilterConfig;

  constructor(
    public calendar: MatCalendar<D>, // calendar instance of picker
    private dateAdapter: DateAdapter<D>, // native or moment date adapter
    @Inject(MAT_DATE_FORMATS)
    private dateFormats: MatDateFormats, // for formatting
    cdr: ChangeDetectorRef
  ) {
    calendar.stateChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }
  // active date label rendered between the arrow buttons
  get periodLabel(): string {
    // use date adapter to format the label, e.g. "SEP 2020"
    return this.dateAdapter
      .format(this.calendar.activeDate, this.dateFormats.display.monthYearLabel)
      .toLocaleUpperCase();
  }

  // called when user clicks on one of the left buttons
  previousClicked(mode: "month" | "year"): void {
    this.changeDate(mode, -1);
  }

  // called when user clicks on one of the right buttons
  nextClicked(mode: "month" | "year"): void {
    this.changeDate(mode, 1);
  }

  currentPeriodClicked() {
    this.calendar.currentView =
      this.calendar.currentView === "multi-year" ? "month" : "multi-year";
  }

  private changeDate(mode: "month" | "year", amount: -1 | 1): void {
    // increment or decrement month or year
    this.calendar.activeDate =
      mode === "month"
        ? this.dateAdapter.addCalendarMonths(this.calendar.activeDate, amount)
        : this.dateAdapter.addCalendarYears(this.calendar.activeDate, amount);
  }
}
