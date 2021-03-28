import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { EntitySelectComponent } from "./entity-select.component";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { Database } from "../../../database/database";
import { MockDatabase } from "../../../database/mock-database";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatChipsModule } from "@angular/material/chips";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Entity } from "../../../entity/entity";
import { ReactiveFormsModule } from "@angular/forms";

class TestEntity extends Entity {
  static create(name: string): TestEntity {
    const entity = new TestEntity();
    entity.name = name;
    return entity;
  }
  name: string;

  getType(): string {
    return "TestEntity";
  }
}

describe("EntitySelectComponent", () => {
  let component: EntitySelectComponent<any>;
  let fixture: ComponentFixture<EntitySelectComponent<any>>;

  const mockEntitiesA: Entity[] = ["Abc", "Bcd", "Abd", "Aba"].map((s) =>
    TestEntity.create(s)
  );
  const mockEntitiesB: Entity[] = [new Entity(), new Entity()];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntitySelectComponent],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        {
          provide: Database,
          useValue: MockDatabase.createWithData(
            mockEntitiesA.concat(mockEntitiesB)
          ),
        },
      ],
      imports: [
        MatAutocompleteModule,
        MatFormFieldModule,
        MatChipsModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("eventually loads all entity-types when the entity-type is set", fakeAsync(() => {
    component.entityType = TestEntity;
    tick();
    expect(component.allEntities.length).toBe(mockEntitiesA.length);
  }));

  it("should not be in loading-state when all data is received", fakeAsync(() => {
    component.entityType = TestEntity;
    tick();
    expect(component.loading.value).toBe(false);
  }));

  it("should suggest all entities after an initial load", async (done) => {
    component.filteredEntities.subscribe((next) => {
      expect(next.length).toBe(mockEntitiesA.length);
      done();
    });
    component.entityType = TestEntity;
  });

  it("contains the initial selection when passed as entity-arguments", fakeAsync(() => {
    component.entityType = TestEntity;
    tick();
    component.selectionInputType = "entity";
    const expectation = mockEntitiesA.slice(2, 3);
    component.selection = expectation;
    expect(component._selection).toEqual(expectation);
  }));

  it("contains the initial selection when passed as id-arguments", fakeAsync(() => {
    component.entityType = TestEntity;
    component.selectionInputType = "id";
    const expectation = mockEntitiesA.slice(2, 3).map((child) => child.getId());
    component.selection = expectation;
    tick();
    expect(component._selection.every((s) => typeof s === "object")).toBeTrue();
    expect(component._selection.map((s) => s.getId())).toEqual(expectation);
  }));

  it("emits whenever an entity is added", fakeAsync(() => {
    spyOn(component.selectionChange, "emit");
    component.entityType = TestEntity;
    tick();
    component.selectionInputType = "entity";
    component.selectEntity(mockEntitiesA[0]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      mockEntitiesA[0],
    ]);
    component.selectEntity(mockEntitiesA[1]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      mockEntitiesA[0],
      mockEntitiesA[1],
    ]);
  }));

  it("emits whenever an entity is removed", () => {
    spyOn(component.selectionChange, "emit");
    component._selection = [...mockEntitiesA];
    component.selectionInputType = "id";
    component.removeEntity(mockEntitiesA[0]);
    const remainingChildren = mockEntitiesA
      .filter((c) => c.getId() !== mockEntitiesA[0].getId())
      .map((c) => c.getId());
    expect(component.selectionChange.emit).toHaveBeenCalledWith(
      remainingChildren
    );
  });

  it("adds a new entity if it matches a known entity", () => {
    component.allEntities = mockEntitiesA;
    component.add({ input: null, value: mockEntitiesA[0]["name"] });
    expect(component._selection).toEqual([mockEntitiesA[0]]);
  });

  it("does not add anything if a new entity doesn't match", () => {
    component.allEntities = mockEntitiesA;
    component.add({ input: null, value: "ZZ" });
    expect(component._selection).toEqual([]);
  });

  it("autocompletes with the default accessor", (done) => {
    component.allEntities = mockEntitiesA;
    component.loading.next(false);
    let iterations = 0;
    let expectedLength = 4;
    component.filteredEntities.subscribe((next) => {
      iterations++;
      expect(next.length).toEqual(expectedLength);
      if (iterations === 4) {
        done();
      }
    });
    expectedLength = 4;
    component.formControl.setValue(null);
    expectedLength = 3;
    component.formControl.setValue("A");
    expectedLength = 3;
    component.formControl.setValue("Ab");
    expectedLength = 1;
    component.formControl.setValue("Abc");
  });
});
