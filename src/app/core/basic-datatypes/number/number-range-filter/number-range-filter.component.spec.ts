import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NumberRangeFilterComponent } from "./number-range-filter.component";
import { Entity } from "app/core/entity/model/entity";
import { NumberFilter } from "app/core/filter/filters/numberFilter";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("NumberRangeFilterComponent", () => {
  let component: NumberRangeFilterComponent<Entity>;
  let fixture: ComponentFixture<NumberRangeFilterComponent<Entity>>;

  let filterConfig: NumberFilter<Entity>;

  beforeEach(async () => {
    filterConfig = new NumberFilter<Entity>("x", "Demo Number Filter");

    await TestBed.configureTestingModule({
      imports: [NumberRangeFilterComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(NumberRangeFilterComponent);
    component = fixture.componentInstance;

    component.filterConfig = filterConfig;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
