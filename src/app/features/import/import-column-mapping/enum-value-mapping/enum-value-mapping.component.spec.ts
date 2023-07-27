import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EnumValueMappingComponent } from "./enum-value-mapping.component";
import { MappingDialogData } from "../import-column-mapping.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Child } from "../../../../child-dev-project/children/model/child";
import { ConfigurableEnumDatatype } from "../../../../core/configurable-enum/configurable-enum-datatype/configurable-enum-datatype";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";
import { genders } from "../../../../child-dev-project/children/model/genders";
import { ConfigurableEnumService } from "../../../../core/configurable-enum/configurable-enum.service";

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
      imports: [EnumValueMappingComponent, MockedTestingModule],
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

  it("should ask for confirmation on save if not all values were assigned", async () => {
    const confirmationSpy = spyOn(
      TestBed.inject(ConfirmationDialogService),
      "getConfirmation"
    );
    component.form.patchValue({ male: "M" });

    await component.save();

    expect(confirmationSpy).toHaveBeenCalled();
  });

  it("should init with entity format of provided mappings in 'additional'", () => {
    data.col.additional = { male: "M" };
    spyOn(
      TestBed.inject(ConfigurableEnumService),
      "getEnumValues"
    ).and.returnValue(genders);

    component.ngOnInit();

    expect(component.form.getRawValue()).toEqual({
      male: genders.find((e) => e.id === "M"),
      female: null,
    });
  });

  it("should set the mapping in database format in 'additional' on save", () => {
    expect(data.col.additional).toBeUndefined();
    component.ngOnInit();

    component.form.setValue({
      male: genders.find((e) => e.id === "M"),
      female: genders.find((e) => e.id === "F"),
    });
    const closeSpy = spyOn(TestBed.inject(MatDialogRef), "close");

    component.save();

    expect(closeSpy).toHaveBeenCalled();
    expect(data.col.additional).toEqual({ male: "M", female: "F" });
  });
});
