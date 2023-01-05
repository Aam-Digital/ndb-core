import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateRangeFilterComponent } from "./date-range-filter.component";
import { MatDialog } from "@angular/material/dialog";
import { MatNativeDateModule } from "@angular/material/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FilterModule } from "../filter.module";

describe("DateRangeFilterComponent", () => {
  let component: DateRangeFilterComponent<any>;
  let fixture: ComponentFixture<DateRangeFilterComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterModule, MatNativeDateModule, NoopAnimationsModule],
      providers: [{ provide: MatDialog, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(DateRangeFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
