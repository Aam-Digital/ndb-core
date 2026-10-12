import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, input } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ComponentRegistry } from "../../../dynamic-components";
import {
  AdminWidgetDialogComponent,
  AdminWidgetDialogData,
} from "./admin-widget-dialog.component";

@Component({ selector: "app-test-widget-settings", template: "" })
class TestWidgetSettingsComponent {
  formControl = input<FormControl>();
}

describe("AdminWidgetDialogComponent", () => {
  let component: AdminWidgetDialogComponent;
  let fixture: ComponentFixture<AdminWidgetDialogComponent>;

  beforeEach(async () => {
    const data: AdminWidgetDialogData = {
      widgetConfig: { component: "TestWidget", config: { some: "value" } },
      settingsComponent: "TestWidgetSettings",
      title: "TestWidget",
    };

    await TestBed.configureTestingModule({
      imports: [AdminWidgetDialogComponent, MockedTestingModule.withState()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    TestBed.inject(ComponentRegistry).add(
      "TestWidgetSettings",
      async () => TestWidgetSettingsComponent,
    );

    fixture = TestBed.createComponent(AdminWidgetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function applyButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector("mat-dialog-actions button");
  }

  it("should update the Apply button when the settings component changes the form's validity", () => {
    expect(applyButton().disabled).toBe(false);

    // settings components set errors on the shared form control from their own effects
    component.widgetConfigForm.setErrors({ invalid: true });
    fixture.detectChanges();
    expect(applyButton().disabled).toBe(true);

    component.widgetConfigForm.setErrors(null);
    fixture.detectChanges();
    expect(applyButton().disabled).toBe(false);
  });
});
