import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CustomIntervalComponent } from "./custom-interval.component";
import { ConfigService } from "../../../../core/config/config.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("CustomIntervalComponent", () => {
  let component: CustomIntervalComponent;
  let fixture: ComponentFixture<CustomIntervalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomIntervalComponent, NoopAnimationsModule],
      providers: [{ provide: ConfigService, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomIntervalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should prevent negative interval amounts", () => {
    component.selectedValue = -1;
    component.validateValue();
    expect(component.selectedValue).toBe(1);

    component.selectedValue = 0;
    component.validateValue();
    expect(component.selectedValue).toBe(1);

    component.selectedValue = 5;
    component.validateValue();
    expect(component.selectedValue).toBe(5);
  });
});
