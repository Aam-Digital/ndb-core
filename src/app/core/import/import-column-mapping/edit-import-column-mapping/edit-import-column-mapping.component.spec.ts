import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditImportColumnMappingComponent } from "./edit-import-column-mapping.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { ColumnMapping } from "../../column-mapping";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

describe("EditImportColumnMappingComponent", () => {
  let component: EditImportColumnMappingComponent;
  let fixture: ComponentFixture<EditImportColumnMappingComponent>;

  const columnMapping: ColumnMapping = {
    column: "test",
    propertyName: "category",
  };

  const rawData = [
    { name: "first", gender: "male" },
    { name: "second", gender: "female" },
    { name: "third", gender: "female" },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, EditImportColumnMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditImportColumnMappingComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("columnMapping", columnMapping);
    fixture.componentRef.setInput("otherColumnMappings", []);
    fixture.componentRef.setInput("rawData", rawData);
    fixture.componentRef.setInput("entityCtor", TestEntity);
    fixture.detectChanges();

    vi.spyOn(component.columnMappingChange, "emit");
  });

  it("should emit changes after selected entity-field is changed", async () => {
    fixture.componentRef.setInput("columnMapping", { column: "name" });
    fixture.componentRef.setInput("entityCtor", TestEntity);
    fixture.detectChanges();

    component.updateMapping();

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({ column: "name" }),
    );
  });

  it("should clear additional when updateMapping is called without settingAdditional flag", () => {
    fixture.componentRef.setInput("columnMapping", {
      column: "test",
      propertyName: "category",
      additional: "someValue",
    });
    fixture.detectChanges();

    component.updateMapping();

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({ column: "test", propertyName: "category" }),
    );
    const emitted = (component.columnMappingChange.emit as any).mock
      .calls[0][0];
    expect(emitted.additional).toBeUndefined();
  });

  it("should emit the newly selected field without the previous transformation config and its review", () => {
    fixture.componentRef.setInput("columnMapping", {
      column: "test",
      propertyName: "category",
      additional: { values: { male: "M" } },
      configReview: "confirmed",
    });
    fixture.detectChanges();

    component.onFieldSelected("name");

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        column: "test",
        propertyName: "name",
        additional: undefined,
        configReview: undefined,
        manuallyUpdated: true,
      }),
    );
  });

  it("should hint about the value mapping config until the user confirmed it", () => {
    // mapped to an enum field, which is configured through a dialog
    expect(component.configHint()).toContain("not configured");

    fixture.componentRef.setInput("columnMapping", {
      ...columnMapping,
      configReview: "cancelled",
    });
    fixture.detectChanges();
    expect(component.configHint()).toContain("was not saved");

    fixture.componentRef.setInput("columnMapping", {
      ...columnMapping,
      configReview: "confirmed",
    });
    fixture.detectChanges();
    expect(component.configHint()).toBeNull();
  });

  it("should not hint for fields that have no config dialog", () => {
    fixture.componentRef.setInput("columnMapping", {
      column: "test",
      propertyName: "name",
    });
    fixture.detectChanges();

    expect(component.configHint()).toBeNull();
  });

  it("should preserve additional when updateMapping is called with settingAdditional=true", () => {
    fixture.componentRef.setInput("columnMapping", {
      column: "test",
      propertyName: "category",
      additional: "someValue",
    });
    fixture.detectChanges();

    component.updateMapping(true);

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        column: "test",
        propertyName: "category",
        additional: "someValue",
      }),
    );
  });
});
