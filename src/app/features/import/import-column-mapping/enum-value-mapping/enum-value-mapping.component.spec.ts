import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EnumValueMappingComponent } from "./enum-value-mapping.component";
import { ImportModule } from "../../import.module";
import { MappingDialogData } from "../import-column-mapping.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Child } from "../../../../child-dev-project/children/model/child";
import { ConfigurableEnumDatatype } from "../../../../core/configurable-enum/configurable-enum-datatype/configurable-enum-datatype";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";

describe("EnumValueMappingComponent", () => {
  let component: EnumValueMappingComponent;
  let fixture: ComponentFixture<EnumValueMappingComponent>;
  const values = ["male", "female", "male"];
  let data: MappingDialogData;

  beforeEach(async () => {
    data = {
      values,
      col: { column: "", propertyName: "gender" },
      entityType: Child,
    };
    await TestBed.configureTestingModule({
      declarations: [EnumValueMappingComponent],
      imports: [ImportModule, MockedTestingModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnumValueMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use the edit component for the selected property", () => {
    expect(component.component).toBe(
      new ConfigurableEnumDatatype(undefined).editComponent
    );
    expect(component.schema).toBe(Child.schema.get("gender"));
  });

  it("should ask for confirmation on save if not all values were assigned", () => {
    const confirmationSpy = spyOn(
      TestBed.inject(ConfirmationDialogService),
      "getConfirmation"
    );
    component.form.patchValue({ male: "M" });

    component.save();

    expect(confirmationSpy).toHaveBeenCalled();
  });

  it("should set the mapping as additional on save", () => {
    expect(data.col.additional).toBeUndefined();
    component.form.setValue({ male: "M", female: "F" });
    const closeSpy = spyOn(TestBed.inject(MatDialogRef), "close");

    component.save();

    expect(closeSpy).toHaveBeenCalled();
    expect(data.col.additional).toEqual({ male: "M", female: "F" });
  });
});
