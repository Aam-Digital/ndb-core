import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityImportConfigComponent } from "./entity-import-config.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { ColumnMapping } from "../../../import/column-mapping";

describe("EntityImportConfigComponent", () => {
  let component: EntityImportConfigComponent;
  let fixture: ComponentFixture<EntityImportConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityImportConfigComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityImportConfigComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize available properties from referenced entity", () => {
    const col: ColumnMapping = {
      column: "test",
      propertyName: "ref",
    };
    component.col = col;
    component.entityType = TestEntity;
    component.otherColumnMappings = [];
    component.ngOnChanges({ col: {} as any });

    expect(component.referencedEntity()).not.toBeNull();
    expect(component.availableProperties().length).toBeGreaterThan(0);
  });

  it("should update additional when ref field changes", () => {
    const col: ColumnMapping = {
      column: "test",
      propertyName: "ref",
    };
    component.col = col;
    component.entityType = TestEntity;
    component.otherColumnMappings = [];
    component.onColumnMappingChange = vi.fn();
    component.ngOnChanges({ col: {} as any });

    component.onRefFieldChange("name");

    expect(component.selectedRefField()).toBe("name");
    expect(component.col.additional).toEqual(
      expect.objectContaining({ refField: "name" }),
    );
  });
});
