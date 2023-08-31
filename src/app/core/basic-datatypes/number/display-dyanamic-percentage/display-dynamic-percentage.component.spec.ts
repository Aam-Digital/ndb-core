import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayDynamicPercentageComponent } from "./display-dynamic-percentage.component";

describe("DisplayDynamicPercentageComponent", () => {
  let component: DisplayDynamicPercentageComponent;
  let fixture: ComponentFixture<DisplayDynamicPercentageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayDynamicPercentageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayDynamicPercentageComponent);
    component = fixture.componentInstance;
    component.value = 10;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
