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
import { Child } from "../../../../child-dev-project/children/model/child";
import { Note } from "../../../../child-dev-project/notes/model/note";
import { Entity } from "../../../entity/entity";
import { any } from "codelyzer/util/function";
import { every } from "rxjs/operators";
import { ReactiveFormsModule } from "@angular/forms";

describe("EntitySelectComponent", () => {
  let component: EntitySelectComponent<any>;
  let fixture: ComponentFixture<EntitySelectComponent<any>>;

  const mockChildren: Entity[] = ["A", "B", "C", "D"].map((s) =>
    Child.create(s)
  );
  const mockNotes: Entity[] = [
    Note.create(new Date()),
    Note.create(new Date(), "subject"),
  ];
  const mockChildrenLength = mockChildren.length;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntitySelectComponent],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        {
          provide: Database,
          useValue: MockDatabase.createWithData(mockChildren.concat(mockNotes)),
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
    component.entityType = Child;
    tick();
    expect(component.allEntities.length).toBe(mockChildrenLength);
  }));

  it("should not be in loading-state when all data is received", fakeAsync(() => {
    component.entityType = Child;
    tick();
    expect(component.loading.value).toBe(false);
  }));

  it("should suggest all entities after an initial load", async (done) => {
    component.filteredEntities.subscribe((next) => {
      expect(next.length).toBe(mockChildrenLength);
      done();
    });
    component.entityType = Child;
  });

  it("contains the initial selection when passed as entity-arguments", fakeAsync(() => {
    component.entityType = Child;
    tick();
    component.selectionInputType = "entity";
    const expectation = mockChildren.slice(2, 3);
    component.selection = expectation;
    expect(component._selection).toEqual(expectation);
  }));

  it("contains the initial selection when passed as id-arguments", fakeAsync(() => {
    component.entityType = Child;
    component.selectionInputType = "id";
    const expectation = mockChildren.slice(2, 3).map((child) => child.getId());
    component.selection = expectation;
    tick();
    expect(component._selection.every((s) => typeof s === "object")).toBeTrue();
    expect(component._selection.map((s) => s.getId())).toEqual(expectation);
  }));

  it("emits whenever an entity is added", fakeAsync(() => {
    spyOn(component.selectionChange, "emit");
    component.entityType = Child;
    tick();
    component.selectionInputType = "entity";
    component.selectEntity(mockChildren[0]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      mockChildren[0],
    ]);
    component.selectEntity(mockChildren[1]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      mockChildren[0],
      mockChildren[1],
    ]);
  }));

  it("emits whenever an entity is removed", () => {
    spyOn(component.selectionChange, "emit");
    component._selection = [...mockChildren];
    component.selectionInputType = "id";
    component.removeEntity(mockChildren[0]);
    const remainingChildren = mockChildren
      .filter((c) => c.getId() !== mockChildren[0].getId())
      .map((c) => c.getId());
    expect(component.selectionChange.emit).toHaveBeenCalledWith(
      remainingChildren
    );
  });

  it("adds a new entity if it matches a known entity", () => {
    component.allEntities = mockChildren;
    component.add({ input: null, value: mockChildren[0]["name"] });
    expect(component._selection).toEqual([mockChildren[0]]);
  });

  it("does not add anything if a new entity doesn't match", () => {
    component.allEntities = mockChildren;
    component.add({ input: null, value: "ZZ" });
    expect(component._selection).toEqual([]);
  });
});
