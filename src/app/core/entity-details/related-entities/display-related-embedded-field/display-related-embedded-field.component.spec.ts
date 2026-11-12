import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { DisplayRelatedEmbeddedFieldComponent } from "./display-related-embedded-field.component";

@DatabaseEntity("RelatedEmbedFieldTestSchool")
class School extends Entity {
  @DatabaseField({
    dataType: "schema-embed-array",
    additional: {
      role: { dataType: "string", label: "Role" },
      person: { dataType: "entity", additional: TestEntity.ENTITY_TYPE },
    },
  })
  contactPersons: { role?: string; person?: string }[];
}

describe("DisplayRelatedEmbeddedFieldComponent", () => {
  let component: DisplayRelatedEmbeddedFieldComponent;
  let fixture: ComponentFixture<DisplayRelatedEmbeddedFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DisplayRelatedEmbeddedFieldComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayRelatedEmbeddedFieldComponent);
    component = fixture.componentInstance;
  });

  function render(entity: Entity, id: string, parent: Entity) {
    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput("id", id);
    fixture.componentRef.setInput("formFieldConfig", {
      id,
      additional: { relatedEntitiesParent: parent },
    });
    fixture.detectChanges();
  }

  it("shows the inner value only of the entries that reference the parent entity", async () => {
    const user = new TestEntity();
    const school = new School();
    school.contactPersons = [
      { person: "TestEntity:other", role: "Principal" },
      { person: user.getId(), role: "Teacher" },
      { person: user.getId(), role: "Coach" },
      { person: user.getId() },
    ];

    render(school, "contactPersons.role", user);

    expect(component.values()).toEqual(["Teacher", "Coach"]);
    await vi.waitFor(() =>
      expect(
        fixture.nativeElement.textContent.replace(/\s+/g, " ").trim(),
      ).toBe("Teacher, Coach"),
    );
  });

  it.each([
    ["an id not nested in an embedded field", "contactPersons"],
    ["an unknown inner field", "contactPersons.unknown"],
  ])("shows nothing for %s", (_, id) => {
    const user = new TestEntity();
    const school = new School();
    school.contactPersons = [{ person: user.getId(), role: "Teacher" }];

    render(school, id, user);

    expect(component.values()).toEqual([]);
  });
});
