import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChildBlockTooltipComponent } from "./child-block-tooltip.component";

describe("ChildBlockTooltipComponent", () => {
  let component: ChildBlockTooltipComponent;
  let fixture: ComponentFixture<ChildBlockTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChildBlockTooltipComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildBlockTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
