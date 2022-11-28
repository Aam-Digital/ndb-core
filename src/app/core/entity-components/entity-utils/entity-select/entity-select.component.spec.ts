import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { EntitySelectComponent } from "./entity-select.component";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatChipsModule } from "@angular/material/chips";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Entity } from "../../../entity/model/entity";
import { ReactiveFormsModule } from "@angular/forms";
import { mockEntityMapper } from "../../../entity/mock-entity-mapper-service";
import { User } from "../../../user/user";
import { Child } from "../../../../child-dev-project/children/model/child";
import { Subscription } from "rxjs";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import {
  EntityRegistry,
  entityRegistry,
} from "../../../entity/database-entity.decorator";

describe("EntitySelectComponent", () => {
  let component: EntitySelectComponent<any>;
  let fixture: ComponentFixture<EntitySelectComponent<any>>;
  let subscription: Subscription = null;

  const testUsers: Entity[] = ["Abc", "Bcd", "Abd", "Aba"].map((s) => {
    const user = new User();
    user.name = s;
    return user;
  });
  const otherEntities: Entity[] = [new Child(), new Child()];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntitySelectComponent],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(testUsers.concat(otherEntities)),
        },
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        EntitySchemaService,
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

  afterEach(() => {
    subscription?.unsubscribe();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("eventually loads all entity-types when the entity-type is set", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    fixture.detectChanges();
    tick();
    expect(component.allEntities.length).toBe(testUsers.length);
  }));

  it("should not be in loading-state when all data is received", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    tick();
    expect(component.loading.value).toBe(false);
  }));

  it("should suggest all entities after an initial load", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    tick();
    fixture.detectChanges();
    expect(component.filteredEntities.length).toBe(testUsers.length);
  }));

  it("contains the initial selection as entities", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    const expectation = testUsers.slice(2, 3).map((user) => user.getId());

    component.selection = expectation;
    fixture.detectChanges();
    tick();

    component.selectedEntities.forEach((s) => expect(s).toBeInstanceOf(User));
    expect(component.selectedEntities.map((s) => s.getId())).toEqual(
      expectation
    );
  }));

  it("emits whenever a new entity is selected", fakeAsync(() => {
    spyOn(component.selectionChange, "emit");
    component.entityType = User.ENTITY_TYPE;
    tick();

    component.selectEntity(testUsers[0]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      testUsers[0].getId(),
    ]);

    component.selectEntity(testUsers[1]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      testUsers[0].getId(),
      testUsers[1].getId(),
    ]);
    tick();
  }));

  it("emits with prefix the new entity selected", fakeAsync(() => {
    component.withPrefix = true;
    spyOn(component.selectionChange, "emit");
    component.entityType = User.ENTITY_TYPE;
    tick();

    component.selectEntity(testUsers[0]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      testUsers[0].getId(true),
    ]);

    component.selectEntity(testUsers[1]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      testUsers[0].getId(true),
      testUsers[1].getId(true),
    ]);
    tick();
  }));

  it("emits whenever a selected entity is removed", () => {
    spyOn(component.selectionChange, "emit");
    component.selectedEntities = [...testUsers];

    component.unselectEntity(testUsers[0]);

    const remainingChildren = testUsers
      .filter((c) => c.getId() !== testUsers[0].getId())
      .map((c) => c.getId());
    expect(component.selectionChange.emit).toHaveBeenCalledWith(
      remainingChildren
    );
  });

  it("adds a new entity if it matches a known entity", () => {
    component.allEntities = testUsers;
    component.select({ value: testUsers[0]["name"] });
    expect(component.selectedEntities).toEqual([testUsers[0]]);
  });

  it("does not add anything if a new entity doesn't match", () => {
    component.allEntities = testUsers;
    component.select({ value: "ZZ" });
    expect(component.selectedEntities).toBeEmpty();
  });

  it("autocompletes with the default accessor", () => {
    component.allEntities = testUsers;
    component.loading.next(false);

    component.formControl.setValue(null);
    expect(component.filteredEntities.length).toEqual(4);

    component.formControl.setValue("A");
    expect(component.filteredEntities.length).toEqual(3);

    component.formControl.setValue("c");
    expect(component.filteredEntities.length).toEqual(2);

    component.formControl.setValue("Abc");
    expect(component.filteredEntities.length).toEqual(1);

    component.formControl.setValue("z");
    expect(component.filteredEntities.length).toEqual(0);
  });

  it("should use the configurable toStringAttributes for comparing values", fakeAsync(() => {
    class Person extends Entity {
      static toStringAttributes = ["firstname", "lastname"];

      firstname: string;
      lastname: string;
    }

    const p1 = Object.assign(new Person(), { firstname: "Aa", lastname: "bb" });
    const p2 = Object.assign(new Person(), { firstname: "Aa", lastname: "cc" });
    component.allEntities = [p1, p2];
    component.loading.next(false);

    component.formControl.setValue("Aa");
    tick();
    expect(component.filteredEntities).toEqual([p1, p2]);

    component.formControl.setValue("Aa b");
    tick();
    expect(component.filteredEntities).toEqual([p1]);
  }));

  it("should add an unselected entity to the filtered entities array", () => {
    component.allEntities = testUsers;
    const selectedUser = testUsers[1];

    component.selectEntity(selectedUser);
    expect(component.filteredEntities).not.toContain(selectedUser);

    component.unselectEntity(selectedUser);
    expect(component.filteredEntities).toContain(selectedUser);
  });
});
