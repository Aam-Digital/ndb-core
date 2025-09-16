import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminNoteDetailsComponent } from "./admin-note-details.component";
import {
  DatabaseEntity,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { SyncStateSubject } from "#src/app/core/session/session-type";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";

describe("AdminNoteDetailsComponent", () => {
  let component: AdminNoteDetailsComponent;
  let fixture: ComponentFixture<AdminNoteDetailsComponent>;
  let mockFormService: jasmine.SpyObj<EntityFormService>;

  @DatabaseEntity("TestNote")
  class TestNote extends Entity {
    static override readonly ENTITY_TYPE = "TestNote";
  }

  beforeEach(async () => {
    mockFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
    ]);
    mockFormService.createEntityForm.and.returnValue(
      Promise.resolve({
        formGroup: new FormGroup({}),
      } as EntityForm<any>),
    );
    await TestBed.configureTestingModule({
      imports: [AdminNoteDetailsComponent],
      providers: [
        { provide: EntityFormService, useValue: mockFormService },
        SyncStateSubject,
        CurrentUserSubject,
        EntityRegistry,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNoteDetailsComponent);
    component = fixture.componentInstance;
    component.entityConstructor = TestNote;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
