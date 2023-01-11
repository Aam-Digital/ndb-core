import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChildBlockTooltipComponent } from "./child-block-tooltip.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ChildBlockTooltipComponent", () => {
  let component: ChildBlockTooltipComponent;
  let fixture: ComponentFixture<ChildBlockTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildBlockTooltipComponent, FontAwesomeTestingModule],
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
