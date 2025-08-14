import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminWidgetDialogComponent } from "./admin-widget-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ComponentRegistry } from "#src/app/dynamic-components";

describe("AdminWidgetDialogComponent", () => {
  let component: AdminWidgetDialogComponent;
  let fixture: ComponentFixture<AdminWidgetDialogComponent>;

  const mockDialogData = {
    widgetConfig: {
      component: "TestWidget",
      config: {
        subtitle: "",
        explanation: "",
      },
    },
    settingsComponent: "TestSettingsComponent",
    title: "Test Title",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWidgetDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ComponentRegistry, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminWidgetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
