import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportColumnMappingComponent } from "./import-column-mapping.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ImportModule } from "../import.module";
import { MatDialog } from "@angular/material/dialog";
import { EnumValueMappingComponent } from "./enum-value-mapping/enum-value-mapping.component";
import { Child } from "../../../child-dev-project/children/model/child";

describe("ImportMapColumnsComponent", () => {
  let component: ImportColumnMappingComponent;
  let fixture: ComponentFixture<ImportColumnMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, ImportModule],
      declarations: [ImportColumnMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportColumnMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
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
});
