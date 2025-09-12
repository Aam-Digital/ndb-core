import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminNoteDetailsComponent } from "./admin-note-details.component";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { NoteDetailsConfig } from "../note-details/note-details-config.interface";

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

  it("should update config when form fields change", () => {
    component.config = {};
    component.ngOnInit();

    const newTopFields = [{ id: "date" }, { id: "category" }];
    component.onTopFormChange(newTopFields);

    expect(component.config.topForm).toEqual(["date", "category"]);
  });

  it("should emit clean NoteDetailsConfig without extra properties", () => {
    let emittedConfig: NoteDetailsConfig;
    component.configChange.subscribe((config) => {
      emittedConfig = config;
    });

    component.config = {
      topForm: ["date", "subject"],
      middleForm: ["text", "category"],
      bottomForm: ["authors", "children"],
    };
    component.ngOnInit();

    component.onTopFormChange([{ id: "subject" }, { id: "warningLevel" }]);

    expect(emittedConfig).toEqual({
      topForm: ["subject", "warningLevel"],
      middleForm: ["text", "category"],
      bottomForm: ["authors", "children"],
    });

    const configKeys = Object.keys(emittedConfig);
    expect(configKeys).toEqual(
      jasmine.arrayWithExactContents(["topForm", "middleForm", "bottomForm"]),
    );
  });
});
