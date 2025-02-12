import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditImportColumnMappingComponent } from "./edit-import-column-mapping.component";
import { MockedTestingModule } from "app/utils/mocked-testing.module";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { ColumnMapping } from "../column-mapping";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { componentRegistry, ComponentRegistry } from "app/dynamic-components";
import { DiscreteImportConfigComponent } from "app/core/basic-datatypes/discrete/discrete-import-config/discrete-import-config.component";

describe("EditImportColumnMappingComponent", () => {
  let component: EditImportColumnMappingComponent;
  let fixture: ComponentFixture<EditImportColumnMappingComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

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
    dialogSpy = jasmine.createSpyObj("MatDialog", ["open"]);
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, EditImportColumnMappingComponent],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ComponentRegistry, useValue: componentRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditImportColumnMappingComponent);
    component = fixture.componentInstance;
    component.col = columnMapping;
    component.rawData = rawData;
    fixture.detectChanges();

    spyOn(component.valueChange, "emit");
  });

  it("should emit changes after popup is closed", async () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
    component.entityCtor = TestEntity;

    await component.openMappingComponent();

    expect(component.valueChange.emit).toHaveBeenCalled();
  });

  it("should open mapping component with required data", async () => {
    component.rawData = rawData;
    component.entityCtor = TestEntity;
    component.columnMapping = [{ column: "name" }, { column: "gender" }];
    dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);

    const genderColumn = component.columnMapping[1];
    genderColumn.propertyName = "category";
    component.col = genderColumn;
    await component.openMappingComponent();

    expect(dialogSpy.open).toHaveBeenCalledWith(
      DiscreteImportConfigComponent,
      jasmine.objectContaining({
        data: {
          col: genderColumn,
          values: ["male", "female"],
          entityType: TestEntity,
        },
      }),
    );
  });

  it("should emit changes after selected entity-field is changed", async () => {
    component.columnMapping = [{ column: "name" }];
    component.entityCtor = TestEntity;

    component.updateMapping();

    expect(component.valueChange.emit).toHaveBeenCalledWith(
      jasmine.arrayContaining([jasmine.objectContaining({ column: "name" })]),
    );
  });
});
