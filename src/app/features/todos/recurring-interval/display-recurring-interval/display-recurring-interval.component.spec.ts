import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayRecurringIntervalComponent } from "./display-recurring-interval.component";
import { generateLabelFromInterval, TimeInterval } from "../time-interval";

describe("DisplayRecurringIntervalComponent", () => {
  let component: DisplayRecurringIntervalComponent;
  let fixture: ComponentFixture<DisplayRecurringIntervalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayRecurringIntervalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayRecurringIntervalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should load dynamic config and generate human-readable label", () => {
    const testInterval: TimeInterval = { amount: 2, unit: "weeks" };
    component.value = testInterval;
    component.ngOnInit();

    expect(component.label).toBe(generateLabelFromInterval(testInterval));
  });
});
