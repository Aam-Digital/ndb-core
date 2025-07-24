import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotEditableWidgetSettingsComponent } from "./not-editable-widget-settings.component";

describe("NotEditableWidgetSettingsComponent", () => {
  let component: NotEditableWidgetSettingsComponent;
  let fixture: ComponentFixture<NotEditableWidgetSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotEditableWidgetSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotEditableWidgetSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
