import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CustomizableTooltipComponent } from "./customizable-tooltip.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("CustomizableTooltipComponent", () => {
  let component: CustomizableTooltipComponent;
  let fixture: ComponentFixture<CustomizableTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomizableTooltipComponent],
      imports: [NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomizableTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
