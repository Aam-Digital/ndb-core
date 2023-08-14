import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportColumnMappingComponent } from "./import-column-mapping.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { MatDialog } from "@angular/material/dialog";
import { EnumValueMappingComponent } from "./enum-value-mapping/enum-value-mapping.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { ColumnMapping } from "../column-mapping";
import { of } from "rxjs";

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

  it("should open mapping component with required data", async () => {
    component.rawData = [
      { name: "first", gender: "male" },
      { name: "second", gender: "female" },
      { name: "third", gender: "female" },
    ];
    component.entityType = "Child";
    component.columnMapping = [{ column: "name" }, { column: "gender" }];
    const openSpy = spyOn(TestBed.inject(MatDialog), "open");
    openSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

    const genderColumn = component.columnMapping[1];
    genderColumn.propertyName = "gender";
    await component.openMappingComponent(genderColumn);

    expect(openSpy).toHaveBeenCalledWith(EnumValueMappingComponent, {
      data: {
        col: genderColumn,
        values: ["male", "female"],
        entityType: Child,
      },
      disableClose: true,
    });
  });

  it("should emit changes after popup is closed", async () => {
    spyOn(TestBed.inject(MatDialog), "open").and.returnValue({
      afterClosed: () => of(undefined),
    } as any);
    component.entityType = "Child";
    const columnMapping: ColumnMapping = {
      column: "test",
      propertyName: "gender",
    };

    await component.openMappingComponent(columnMapping);

    expect(component.columnMappingChange.emit).toHaveBeenCalled();
  });
});
