import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayPercentageComponent } from "./display-dynamic-value.component";

describe("DisplayDynamicValueComponent", () => {
  let component: DisplayDynamicValueComponent;
  let fixture: ComponentFixture<DisplayDynamicValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayDynamicValueComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayDynamicValueComponent);
    component = fixture.componentInstance;
    component.value = 10;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
