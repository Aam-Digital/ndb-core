import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "../../entity/entity-special-loader/entity-special-loader.service";
import { Entity } from "../../entity/model/entity";
import { DisplayRelatedEmbeddedFieldComponent } from "./display-related-embedded-field/display-related-embedded-field.component";
import { RelatedEntitiesComponent } from "./related-entities.component";

describe("RelatedEntitiesComponent", () => {
  let component: RelatedEntitiesComponent<any>;
  let fixture: ComponentFixture<RelatedEntitiesComponent<any>>;
  let mockLoaderService: any;

  beforeEach(async () => {
    mockLoaderService = {
      loadDataFor: vi.fn().mockName("EntitySpecialLoaderService.loadDataFor"),
    };
    await TestBed.configureTestingModule({
      imports: [RelatedEntitiesComponent, MockedTestingModule.withState()],
      providers: [
        { provide: EntitySpecialLoaderService, useValue: mockLoaderService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RelatedEntitiesComponent<any>);
    component = fixture.componentInstance;
  });

  async function initComponent() {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it("should create a filter for the passed entity", async () => {
    const entity = new TestEntity();
    const columns = ["name"];
    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.componentRef.setInput("property", "ref");
    fixture.componentRef.setInput("columns", columns);
    await initComponent();

    expect(component.filterObj()).toEqual({ ref: entity.getId() });
  });

  it("should also include the provided filter", async () => {
    const entity = new TestEntity();
    const filter = { start: { $exists: true } };

    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.componentRef.setInput("property", "ref");
    fixture.componentRef.setInput("filter", { ...filter });
    await initComponent();

    expect(component.filterObj()).toEqual({
      ...filter,
      ref: entity.getId(),
    });
  });

  it("should create a new entity that references the related one", async () => {
    const related = new TestEntity();
    fixture.componentRef.setInput("entity", related);
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.componentRef.setInput("property", "ref");
    fixture.componentRef.setInput("columns", []);
    await initComponent();

    const newEntity = component.createNewRecordFactory()();

    expect(newEntity instanceof TestEntity).toBe(true);
    expect(newEntity["ref"]).toBe(related.getId());
  });

  it("should pre-fill a new entity from a filter selecting a single value in a list", async () => {
    fixture.componentRef.setInput("entity", new TestEntity());
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.componentRef.setInput("property", "ref");
    fixture.componentRef.setInput("filter", { other: { $in: ["A"] } });
    await initComponent();

    const newEntity = component.createNewRecordFactory()();

    expect(newEntity["other"]).toBe("A");
  });

  it("should support multiple related properties", async () => {
    @DatabaseEntity("MultiPropTest")
    class MultiPropTest extends Entity {}

    MultiPropTest.schema.set("singleChild", {
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    });
    MultiPropTest.schema.set("multiEntities", {
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: [TestEntity.ENTITY_TYPE, "OtherType"],
    });

    const entity = new TestEntity();
    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput("entityType", MultiPropTest.ENTITY_TYPE);
    fixture.componentRef.setInput("filter", {});

    await initComponent();

    // filter matching relations at any of the available props
    expect(component.filterObj()).toEqual({
      $or: [
        { singleChild: entity.getId() },
        { multiEntities: { $elemMatch: { $eq: entity.getId() } } },
      ],
    });
    // all matching properties set when creating a new entity
    const newEntity = component.createNewRecordFactory()();
    expect(newEntity.singleChild).toBe(entity.getId());
    expect(newEntity.multiEntities).toEqual([entity.getId()]);
  });

  it("should align the filter with the related properties", async () => {
    @DatabaseEntity("PropTest")
    class PropTest extends Entity {}
    fixture.componentRef.setInput("entityType", PropTest.ENTITY_TYPE);

    PropTest.schema.set("singleRelation", {
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    });
    fixture.componentRef.setInput("entity", new TestEntity());
    fixture.componentRef.setInput("filter", undefined);
    fixture.componentRef.setInput("property", undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.filterObj()).toEqual({
      singleRelation: component.entity().getId(),
    });

    PropTest.schema.set("arrayRelation", {
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: TestEntity.ENTITY_TYPE,
    });
    fixture.componentRef.setInput("entity", new TestEntity());
    fixture.componentRef.setInput("filter", undefined);
    fixture.componentRef.setInput("property", undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.filterObj()).toEqual({
      $or: [
        { singleRelation: component.entity().getId() },
        { arrayRelation: { $elemMatch: { $eq: component.entity().getId() } } },
      ],
    });

    PropTest.schema.set("multiTypeRelation", {
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: [Entity.ENTITY_TYPE, TestEntity.ENTITY_TYPE],
    });
    fixture.componentRef.setInput("entity", new Entity());
    fixture.componentRef.setInput("filter", undefined);
    fixture.componentRef.setInput("property", undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.filterObj()).toEqual({
      multiTypeRelation: { $elemMatch: { $eq: component.entity().getId() } },
    });

    // Now with 2 relations ("singleRelation" and "multiTypeRelation")
    fixture.componentRef.setInput("entity", new TestEntity());
    fixture.componentRef.setInput("filter", undefined);
    fixture.componentRef.setInput("property", undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.filterObj()).toEqual({
      $or: [
        { singleRelation: component.entity().getId() },
        { arrayRelation: { $elemMatch: { $eq: component.entity().getId() } } },
        {
          multiTypeRelation: {
            $elemMatch: { $eq: component.entity().getId() },
          },
        },
      ],
    });

    // preselected property should not be changed
    fixture.componentRef.setInput("entity", new TestEntity());
    fixture.componentRef.setInput("filter", undefined);
    fixture.componentRef.setInput("property", "singleRelation");
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.filterObj()).toEqual({
      singleRelation: component.entity().getId(),
    });
  });

  it("should detect entity references nested in embedded schemas (e.g. attendance.participant)", async () => {
    @DatabaseEntity("EmbedTest")
    class EmbedTest extends Entity {}

    EmbedTest.schema.set("attendance", {
      dataType: "attendance",
      isArray: true,
      additional: {
        participant: {
          dataType: EntityDatatype.dataType,
          additional: [TestEntity.ENTITY_TYPE, "OtherType"],
        },
      },
    });

    fixture.componentRef.setInput("entityType", EmbedTest.ENTITY_TYPE);
    fixture.componentRef.setInput("entity", new TestEntity());
    fixture.componentRef.setInput("filter", undefined);
    fixture.componentRef.setInput("property", undefined);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.filterObj()).toEqual({
      attendance: {
        $elemMatch: { participant: component.entity().getId() },
      },
    });
  });

  it("should combine direct and nested entity references in filter", async () => {
    @DatabaseEntity("MixedEmbedTest")
    class MixedEmbedTest extends Entity {}

    MixedEmbedTest.schema.set("authors", {
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: TestEntity.ENTITY_TYPE,
    });
    MixedEmbedTest.schema.set("attendance", {
      dataType: "attendance",
      isArray: true,
      additional: {
        participant: {
          dataType: EntityDatatype.dataType,
          additional: [TestEntity.ENTITY_TYPE],
        },
      },
    });

    fixture.componentRef.setInput("entityType", MixedEmbedTest.ENTITY_TYPE);
    fixture.componentRef.setInput("entity", new TestEntity());
    fixture.componentRef.setInput("filter", undefined);
    fixture.componentRef.setInput("property", undefined);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.filterObj()).toEqual({
      $or: [
        { authors: { $elemMatch: { $eq: component.entity().getId() } } },
        {
          attendance: {
            $elemMatch: { participant: component.entity().getId() },
          },
        },
      ],
    });
  });

  it("should resolve nested entity ref when property is manually set to an embedded schema field", async () => {
    @DatabaseEntity("ManualPropTest")
    class ManualPropTest extends Entity {}

    ManualPropTest.schema.set("authors", {
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: TestEntity.ENTITY_TYPE,
    });
    ManualPropTest.schema.set("attendance", {
      dataType: "attendance",
      isArray: true,
      additional: {
        participant: {
          dataType: EntityDatatype.dataType,
          additional: [TestEntity.ENTITY_TYPE],
        },
      },
    });

    fixture.componentRef.setInput("entityType", ManualPropTest.ENTITY_TYPE);
    fixture.componentRef.setInput("entity", new TestEntity());
    fixture.componentRef.setInput("filter", undefined);
    fixture.componentRef.setInput("property", "attendance");
    fixture.detectChanges();
    await fixture.whenStable();

    // should only filter by attendance, not authors
    expect(component.filterObj()).toEqual({
      attendance: {
        $elemMatch: { participant: component.entity().getId() },
      },
    });
  });

  describe("columns of an embedded field", () => {
    @DatabaseEntity("EmbedColumnTest")
    class EmbedColumnTest extends Entity {}

    const reference = {
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    };
    EmbedColumnTest.schema.set("name", { dataType: "string" });
    EmbedColumnTest.schema.set("contactPersons", {
      dataType: "schema-embed-array",
      isArray: true,
      additional: {
        role: { dataType: "string", label: "Role" },
        level: { dataType: "number", label: "Level" },
        person: reference,
        supervisor: reference,
        mentors: { ...reference, isArray: true },
      },
    });
    EmbedColumnTest.schema.set("mainContact", {
      dataType: "schema-embed",
      additional: {
        role: { dataType: "string", label: "Main role" },
        person: reference,
      },
    });

    async function initWithColumns(
      columns: unknown[],
      property?: string,
    ): Promise<TestEntity> {
      const user = new TestEntity();
      fixture.componentRef.setInput("entityType", EmbedColumnTest.ENTITY_TYPE);
      fixture.componentRef.setInput("entity", user);
      fixture.componentRef.setInput("columns", columns);
      if (property) {
        fixture.componentRef.setInput("property", property);
      }
      await initComponent();
      return user;
    }

    function createCell(rowData: object, columnId: string) {
      const column = component._columns().find((c) => c.id === columnId);
      const cell = TestBed.createComponent(
        DisplayRelatedEmbeddedFieldComponent,
      );
      cell.componentRef.setInput(
        "entity",
        Object.assign(new EmbedColumnTest(), rowData),
      );
      cell.componentRef.setInput("id", columnId);
      cell.componentRef.setInput("formFieldConfig", column);
      return cell;
    }

    it("shows the inner field of the entries linking the current entity, not sortable", async () => {
      const user = await initWithColumns(["name", "contactPersons.role"]);

      const [nameColumn, roleColumn] = component._columns();
      expect(nameColumn.viewComponent).toBeUndefined();
      expect(roleColumn).toEqual(
        expect.objectContaining({
          id: "contactPersons.role",
          label: "Role",
          viewComponent: "DisplayRelatedEmbeddedField",
          noSorting: true,
          additional: expect.objectContaining({
            relatedEntitiesParent: user,
            outerProp: "contactPersons",
            innerField: expect.objectContaining({ id: "role", label: "Role" }),
          }),
        }),
      );
    });

    it("keeps the additional config and the view component set for a column", async () => {
      const user = await initWithColumns([
        { id: "contactPersons.role", additional: { custom: true } },
        { id: "contactPersons.level", viewComponent: "DisplayText" },
      ]);

      const [roleColumn, levelColumn] = component._columns();
      expect(roleColumn.additional).toEqual(
        expect.objectContaining({ custom: true, relatedEntitiesParent: user }),
      );
      expect(levelColumn.viewComponent).toBe("DisplayText");
      expect(levelColumn.additional).toBeUndefined();
    });

    it("limits the filter and the shown entries to the given relation property", async () => {
      const user = await initWithColumns(
        ["contactPersons.role"],
        "contactPersons.supervisor",
      );

      expect(component.filterObj()).toEqual({
        contactPersons: { $elemMatch: { supervisor: user.getId() } },
      });
      expect(component._columns()[0].additional.linkProps).toEqual([
        "supervisor",
      ]);
    });

    it.each([
      [
        "ignores the entries of other records",
        "contactPersons.role",
        (id: string) => ({
          contactPersons: [
            { person: "TestEntity:other", role: "A" },
            { person: id, role: "B" },
          ],
        }),
        ["B"],
      ],
      [
        "skips empty values of the linking entries",
        "contactPersons.role",
        (id: string) => ({
          contactPersons: [
            { person: id, role: "A" },
            { person: id },
            { supervisor: id, role: "" },
            { person: id, role: "C" },
          ],
        }),
        ["A", "C"],
      ],
      [
        "keeps a falsy value that is set",
        "contactPersons.level",
        (id: string) => ({ contactPersons: [{ person: id, level: 0 }] }),
        [0],
      ],
      [
        "finds the record in a reference holding several records",
        "contactPersons.role",
        (id: string) => ({
          contactPersons: [
            { mentors: ["TestEntity:other", id], role: "Mentor" },
          ],
        }),
        ["Mentor"],
      ],
      [
        "reads a single embedded object",
        "mainContact.role",
        (id: string) => ({ mainContact: { person: id, role: "Lead" } }),
        ["Lead"],
      ],
      [
        "shows nothing if no entry links the entity",
        "contactPersons.role",
        () => ({
          contactPersons: [{ person: "TestEntity:other", role: "A" }],
        }),
        [],
      ],
    ])("cell %s", async (_, columnId, rowData, expected) => {
      const user = await initWithColumns([
        "contactPersons.role",
        "contactPersons.level",
        "mainContact.role",
      ]);

      const cell = createCell(rowData(user.getId()), columnId);

      expect(cell.componentInstance.values()).toEqual(expected);
    });

    it("cell shows only the entries of the explicit relation property", async () => {
      const user = await initWithColumns(
        ["contactPersons.role"],
        "contactPersons.supervisor",
      );

      const cell = createCell(
        {
          contactPersons: [
            { person: user.getId(), role: "Teacher" },
            { supervisor: user.getId(), role: "Head" },
          ],
        },
        "contactPersons.role",
      );

      expect(cell.componentInstance.values()).toEqual(["Head"]);
    });

    it("cell lists several values comma separated", async () => {
      const user = await initWithColumns(["contactPersons.role"]);

      const cell = createCell(
        {
          contactPersons: [
            { person: user.getId(), role: "Teacher" },
            { person: user.getId(), role: "Coach" },
          ],
        },
        "contactPersons.role",
      );
      cell.detectChanges();

      await vi.waitFor(() =>
        expect(cell.nativeElement.textContent.replace(/\s+/g, " ").trim()).toBe(
          "Teacher, Coach",
        ),
      );
    });
  });

  it("it calls children service with id from passed child", async () => {
    const child = createEntityOfType("Child");
    mockLoaderService.loadDataFor.mockResolvedValue([]);

    fixture.componentRef.setInput("entity", child);
    fixture.componentRef.setInput("entityType", "ChildSchoolRelation");
    fixture.componentRef.setInput("columns", []);
    fixture.componentRef.setInput(
      "loaderMethod",
      LoaderMethod.ChildrenServiceQueryRelations,
    );
    await initComponent();

    expect(mockLoaderService.loadDataFor).toHaveBeenCalledWith(
      LoaderMethod.ChildrenServiceQueryRelations,
      child,
      "childId",
    );
  });
});
