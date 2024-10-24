import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RangeInputComponent } from "./range-input.component";

describe("RangeInputComponent", () => {
  let component: RangeInputComponent;
  let fixture: ComponentFixture<RangeInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RangeInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RangeInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
