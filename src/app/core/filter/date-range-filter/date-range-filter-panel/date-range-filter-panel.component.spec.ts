import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateRangeFilterPanelComponent } from "./date-range-filter-panel.component";
import { MatNativeDateModule } from "@angular/material/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { DateRange } from "@angular/material/datepicker";
import { MatCalendarHarness } from "@angular/material/datepicker/testing";
import moment from "moment";

fdescribe("DateRangeFilterPanelComponent", () => {
  let component: DateRangeFilterPanelComponent;
  let fixture: ComponentFixture<DateRangeFilterPanelComponent>;
  let loader: HarnessLoader;
  let closeSpy: jasmine.Spy;

  beforeEach(async () => {
    closeSpy = jasmine.createSpy();
    await TestBed.configureTestingModule({
      imports: [MatNativeDateModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            dateRangeFilterConfig: {
              id: "test1",
              options: [],
            },
          },
        },
        { provide: MatDialogRef, useValue: { close: closeSpy } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DateRangeFilterPanelComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display the given dates in the calendar", async () => {
    const fromDate = moment().startOf("month");
    const toDate = moment().startOf("month").add(13, "days");
    component.selectedRangeValue = new DateRange(
      fromDate.toDate(),
      toDate.toDate()
    );
    fixture.detectChanges();
    const calendar = await loader.getHarness(MatCalendarHarness);
    const cells = await calendar.getCells();
    for (let i = 1; i < cells.length; i++) {
      if (i <= 13) {
        await expectAsync(cells[i].isInRange()).toBeResolvedTo(true);
      } else {
        await expectAsync(cells[i].isInRange()).toBeResolvedTo(false);
      }
    }
  });

  it("should return the manually selected dates", async () => {
    const calendar = await loader.getHarness(MatCalendarHarness);
    const cells = await calendar.getCells();
    await cells[7].select();
    await cells[12].select();
    console.log(component.selectedRangeValue);
    const fromDate = new Date();
    const toDate = new Date();
    fromDate.setDate(8);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setDate(13);
    toDate.setHours(0, 0, 0, 0);
    expect(closeSpy).toHaveBeenCalledWith(new DateRange(fromDate, toDate));
  });
});
