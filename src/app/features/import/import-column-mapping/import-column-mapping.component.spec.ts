import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportColumnMappingComponent } from "./import-column-mapping.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { MatDialog } from "@angular/material/dialog";
import { EnumValueMappingComponent } from "./enum-value-mapping/enum-value-mapping.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { SimpleChange } from "@angular/core";
import { ColumnMapping } from "../column-mapping";

describe("ImportMapColumnsComponent", () => {
  let component: ImportColumnMappingComponent;
  let fixture: ComponentFixture<ImportColumnMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, ImportColumnMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportColumnMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOn(component.columnMappingChange, "emit");
  });

  it("should reset invalid mappings when new entityType selected", () => {
    component.columnMapping = [
      { column: "x", propertyName: "name" }, // property also exists on new entityType
      { column: "y", propertyName: "projectNumber" }, // property does not exist on new entityType
    ];

    component.entityType = "School";
    component.ngOnChanges({
      entityType: new SimpleChange("Child", "School", false),
    });

    const expectedNewMapping: ColumnMapping[] = [
      { column: "x", propertyName: "name" },
      {
        column: "y",
        propertyName: undefined,
      },
    ];

    expect(component.columnMapping).toEqual(expectedNewMapping);
    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expectedNewMapping
    );
  });

  it("should open mapping component with required data", () => {
    component.rawData = [
      { name: "first", gender: "male" },
      { name: "second", gender: "female" },
      { name: "third", gender: "female" },
    ];
    component.entityType = "Child";
    component.columnMapping = [{ column: "name" }, { column: "gender" }];
    const openSpy = spyOn(TestBed.inject(MatDialog), "open");

    const genderColumn = component.columnMapping[1];
    genderColumn.propertyName = "gender";
    component.openMappingComponent(genderColumn);

    expect(openSpy).toHaveBeenCalledWith(EnumValueMappingComponent, {
      data: {
        col: genderColumn,
        values: ["male", "female"],
        entityType: Child,
      },
      disableClose: true,
    });
  });

  it("should emit on updateMapping from UI", () => {
    component.updateMapping();

    expect(component.columnMappingChange.emit).toHaveBeenCalled();
  });

  it("should emit on changes from popup form with additional details", () => {
    // TODO: test additional mapping details from popup form to be applied and emitted
  });
});
