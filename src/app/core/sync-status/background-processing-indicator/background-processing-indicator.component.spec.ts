import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BackgroundProcessingIndicatorComponent } from "./background-processing-indicator.component";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";

describe("BackgroundProcessingIndicatorComponent", () => {
  let component: BackgroundProcessingIndicatorComponent;
  let fixture: ComponentFixture<BackgroundProcessingIndicatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MatMenuModule, MatTooltipModule],
      declarations: [BackgroundProcessingIndicatorComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackgroundProcessingIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
