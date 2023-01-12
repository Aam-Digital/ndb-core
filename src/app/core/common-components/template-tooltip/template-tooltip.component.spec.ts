import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TemplateTooltipComponent } from "./template-tooltip.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("TemplateTooltipComponent", () => {
  let component: TemplateTooltipComponent;
  let fixture: ComponentFixture<TemplateTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateTooltipComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
