import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminNoteDetailsComponent } from "./admin-note-details.component";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/model/entity";

describe("AdminNoteDetailsComponent", () => {
  let component: AdminNoteDetailsComponent;
  let fixture: ComponentFixture<AdminNoteDetailsComponent>;

  @DatabaseEntity("TestNote")
  class TestNote extends Entity {
    static override readonly ENTITY_TYPE = "TestNote";
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNoteDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNoteDetailsComponent);
    component = fixture.componentInstance;
    component.entityConstructor = TestNote;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
