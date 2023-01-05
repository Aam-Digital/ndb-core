import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateRangeFilterPanelComponent } from "./date-range-filter-panel.component";
import { MatNativeDateModule } from "@angular/material/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FilterModule } from "../../filter.module";

describe("DateRangeFilterPanelComponent", () => {
  let component: DateRangeFilterPanelComponent<Date>;
  let fixture: ComponentFixture<DateRangeFilterPanelComponent<Date>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterModule, MatNativeDateModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DateRangeFilterPanelComponent<Date>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
