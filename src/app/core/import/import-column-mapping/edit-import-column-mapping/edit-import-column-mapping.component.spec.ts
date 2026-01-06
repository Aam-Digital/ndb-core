import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditImportColumnMappingComponent } from "./edit-import-column-mapping.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { ColumnMapping } from "../../column-mapping";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import {
  componentRegistry,
  ComponentRegistry,
} from "../../../../dynamic-components";
import { DiscreteImportConfigComponent } from "../../../basic-datatypes/discrete/discrete-import-config/discrete-import-config.component";

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
    component.columnMapping = columnMapping;
    component.otherColumnMappings = [];
    component.rawData = rawData;
    component.entityCtor = TestEntity;
    fixture.detectChanges();

    spyOn(component.columnMappingChange, "emit");
  });

  it("should emit changes after popup is closed", async () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
    component.entityCtor = TestEntity;
    component.updateMapping();

    (component.columnMappingChange.emit as jasmine.Spy).calls.reset(); // ignore previous emit calls
    await component.openMappingComponent();

    expect(component.columnMappingChange.emit).toHaveBeenCalled();
  });

  it("should open mapping component with required data", async () => {
    component.rawData = rawData;
    component.entityCtor = TestEntity;
    component.columnMapping = { column: "gender" };
    component.additionalSettings = { multiValueSeparator: ";" };
    dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);

    const genderColumn = component.columnMapping;
    genderColumn.propertyName = "category";

    component.updateMapping();
    component.columnMapping = genderColumn;
    await component.openMappingComponent();

    expect(dialogSpy.open).toHaveBeenCalledWith(
      DiscreteImportConfigComponent,
      jasmine.objectContaining({
        data: {
          col: genderColumn,
          values: ["male", "female"],
          entityType: TestEntity,
          additionalSettings: { multiValueSeparator: ";" },
        },
      }),
    );
  });

  it("should emit changes after selected entity-field is changed", async () => {
    component.columnMapping = { column: "name" };
    component.entityCtor = TestEntity;

    component.updateMapping();

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ column: "name" }),
    );
  });
});
