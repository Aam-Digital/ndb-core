import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportColumnMappingComponent } from "./import-column-mapping.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { MatDialog } from "@angular/material/dialog";
import { DiscreteImportConfigComponent } from "../../basic-datatypes/discrete/discrete-import-config/discrete-import-config.component";
import { ColumnMapping } from "../column-mapping";
import { of } from "rxjs";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("ImportColumnMappingComponent", () => {
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
    component.entityType = TestEntity.ENTITY_TYPE;
    component.columnMapping = [{ column: "name" }, { column: "gender" }];
    const openSpy = spyOn(TestBed.inject(MatDialog), "open");
    openSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

    const genderColumn = component.columnMapping[1];
    genderColumn.propertyName = "category";
    await component.openMappingComponent(genderColumn);

    expect(openSpy).toHaveBeenCalledWith(
      DiscreteImportConfigComponent,
      jasmine.objectContaining({
        data: {
          col: genderColumn,
          values: ["male", "female"],
          entityType: TestEntity,
        },
        disableClose: true,
      }),
    );
  });

  it("should emit changes after popup is closed", async () => {
    spyOn(TestBed.inject(MatDialog), "open").and.returnValue({
      afterClosed: () => of(undefined),
    } as any);
    component.entityType = TestEntity.ENTITY_TYPE;
    const columnMapping: ColumnMapping = {
      column: "test",
      propertyName: "category",
    };

    await component.openMappingComponent(columnMapping);

    expect(component.columnMappingChange.emit).toHaveBeenCalled();
  });
});
