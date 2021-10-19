import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DisabledWrapperComponent } from "./disabled-wrapper.component";
import { MatTooltipModule } from "@angular/material/tooltip";

describe("DisabledWrapperComponent", () => {
  let component: DisabledWrapperComponent;
  let fixture: ComponentFixture<DisabledWrapperComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DisabledWrapperComponent],
        imports: [MatTooltipModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DisabledWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
