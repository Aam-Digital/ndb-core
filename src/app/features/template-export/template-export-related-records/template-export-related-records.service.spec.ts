import { TestBed } from "@angular/core/testing";
import { CoreTestingModule } from "#src/app/utils/core-testing.module";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "#src/app/core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { Logging } from "#src/app/core/logging/logging.service";
import { TemplateExport } from "../template-export.entity";
import { TemplateExportRelatedRecords } from "./template-export-related-records";
import {
  RelatedRecordsData,
  TemplateExportRelatedRecordsService,
} from "./template-export-related-records.service";

describe("TemplateExportRelatedRecordsService", () => {
  @DatabaseEntity("RelatedRecordsProject")
  class Project extends Entity {
    static override readonly toStringAttributes = ["title"];

    @DatabaseField() title: string;
  }

  @DatabaseEntity("RelatedRecordsPerson")
  class Person extends Entity {
    @DatabaseField() name: string;
  }

  /** a record type forming a hierarchy among itself, that can also be linked to a project */
  @DatabaseEntity("RelatedRecordsAction")
  class Action extends Entity {
    static override readonly toStringAttributes = ["title"];

    @DatabaseField() title: string;

    @DatabaseField({
      dataType: "entity",
      additional: ["RelatedRecordsAction", "RelatedRecordsProject"],
    })
    parent: string;

    @DatabaseField({
      dataType: "entity",
      isArray: true,
      additional: "RelatedRecordsAction",
    })
    blockedBy: string[];

    @DatabaseField({ dataType: "entity", additional: "RelatedRecordsPerson" })
    owner: string;
  }

  /** a record type linking to persons inside embedded objects */
  @DatabaseEntity("RelatedRecordsMeeting")
  class Meeting extends Entity {
    static override readonly toStringAttributes = ["title"];

    @DatabaseField() title: string;

    @DatabaseField({
      dataType: "schema-embed-array",
      additional: {
        person: { dataType: "entity", additional: "RelatedRecordsPerson" },
        role: { dataType: "string" },
      },
    })
    attendees: { person: string; role: string }[];
  }

  const SUB_ACTIONS: TemplateExportRelatedRecords = {
    entityType: "RelatedRecordsAction",
    property: "parent",
  };
  const BLOCKING: TemplateExportRelatedRecords = {
    entityType: "RelatedRecordsAction",
    property: "blockedBy",
  };

  function relatedList(
    config: TemplateExportRelatedRecords,
    list: unknown[] = [],
  ): RelatedRecordsData {
    return {
      _related: { [config.entityType]: { [config.property]: list } },
    } as RelatedRecordsData;
  }

  let service: TemplateExportRelatedRecordsService;
  let entityMapper: MockEntityMapperService;

  function action(title: string, values: Partial<Action> = {}): Action {
    const entity = Object.assign(new Action(title), { title }, values);
    entityMapper.add(entity);
    return entity;
  }

  function template(
    ...relatedRecords: TemplateExportRelatedRecords[]
  ): TemplateExport {
    return Object.assign(new TemplateExport(), { relatedRecords });
  }

  function listOf(
    data: RelatedRecordsData | Record<string, any>,
    config: TemplateExportRelatedRecords = SUB_ACTIONS,
  ): Record<string, any>[] | undefined {
    return data?._related?.[config.entityType]?.[config.property];
  }

  /** the titles of the related records of the config, including those of nested levels */
  function titles(
    data: RelatedRecordsData | Record<string, any>,
    config: TemplateExportRelatedRecords = SUB_ACTIONS,
  ) {
    return listOf(data, config)?.map((record) =>
      listOf(record, config)
        ? [record.title, titles(record, config)]
        : record.title,
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [...mockEntityMapperProvider()],
    });
    service = TestBed.inject(TemplateExportRelatedRecordsService);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not load anything for a template without related records", async () => {
    const loadType = vi.spyOn(entityMapper, "loadType");

    const result = await service.loadRelatedRecords(template(), [
      action("Root"),
    ]);

    expect(result.size).toBe(0);
    expect(loadType).not.toHaveBeenCalled();
  });

  it("lists the active records linking to each exported record, sorted by display text", async () => {
    const rootA = action("Root A");
    const rootB = action("Root B");
    action("Step 10", { parent: rootA.getId() });
    action("Step 2", { parent: rootA.getId() });
    action("Archived", { parent: rootA.getId(), inactive: true });
    action("Unrelated", { parent: "RelatedRecordsAction:other" });
    // linking to the record in another field than the configured one
    action("Blocked", { blockedBy: [rootA.getId()] });
    const loadLinking = vi.spyOn(
      TestBed.inject(EntityRelationsService),
      "loadLinkingToEntities",
    );

    const result = await service.loadRelatedRecords(template(SUB_ACTIONS), [
      rootA,
      rootB,
    ]);

    expect(titles(result.get(rootA.getId()))).toEqual(["Step 2", "Step 10"]);
    // an empty list rather than no list, so that a loop in the template prints nothing
    expect(result.get(rootB.getId())).toEqual(relatedList(SUB_ACTIONS));
    // one lookup for all exported records, not one per record
    expect(loadLinking).toHaveBeenCalledTimes(1);
  });

  it("provides related records as copies with their own links resolved", async () => {
    const owner = Object.assign(new Person("owner"), { name: "Olivia" });
    entityMapper.add(owner);
    const root = action("Root");
    const step = action("Step", {
      parent: root.getId(),
      owner: owner.getId(),
    });

    const result = await service.loadRelatedRecords(template(SUB_ACTIONS), [
      root,
    ]);

    const [related] = listOf(result.get(root.getId()));
    expect(related).toEqual(
      expect.objectContaining({
        title: "Step",
        owner: expect.objectContaining({ name: "Olivia" }),
      }),
    );
    expect(related).not.toBe(step);
    expect(step.owner).toBe(owner.getId());
  });

  it("includes archived records, and the records below them, if configured", async () => {
    const root = action("Root");
    const archived = action("Archived", {
      parent: root.getId(),
      inactive: true,
    });
    action("Below archived", { parent: archived.getId() });

    const result = await service.loadRelatedRecords(
      template({ ...SUB_ACTIONS, levels: 2, includeArchived: true }),
      [root],
    );

    expect(titles(result.get(root.getId()))).toEqual([
      ["Archived", ["Below archived"]],
    ]);
    expect(listOf(result.get(root.getId()))[0].inactive).toBe(true);
  });

  it("lists records linking to the record inside embedded objects", async () => {
    const person = Object.assign(new Person(), { name: "Pat" });
    const other = Object.assign(new Person(), { name: "Other" });
    entityMapper.addAll([person, other]);
    const attendedBy = (...persons: Person[]) =>
      persons.map((p) => ({ person: p.getId(), role: "guest" }));
    const meeting = Object.assign(new Meeting(), {
      title: "Kick-off",
      attendees: attendedBy(other, person),
    });
    const otherMeeting = Object.assign(new Meeting(), {
      title: "Other meeting",
      attendees: attendedBy(other),
    });
    entityMapper.addAll([meeting, otherMeeting]);
    const attendance: TemplateExportRelatedRecords = {
      entityType: "RelatedRecordsMeeting",
      property: "attendees",
    };

    const result = await service.loadRelatedRecords(template(attendance), [
      person,
    ]);

    const [related] = listOf(result.get(person.getId()), attendance);
    expect(titles(result.get(person.getId()), attendance)).toEqual([
      "Kick-off",
    ]);
    // the embedded objects keep their other details
    expect(related.attendees).toEqual([
      expect.objectContaining({ role: "guest" }),
      expect.objectContaining({ role: "guest" }),
    ]);
  });

  it("keeps only the ids in the link field of related records, as the linked record is one level up", async () => {
    const root = action("Root");
    const other = action("Other");
    action("Waiting", { blockedBy: [root.getId(), other.getId()] });

    const result = await service.loadRelatedRecords(template(BLOCKING), [root]);

    const [related] = listOf(result.get(root.getId()), BLOCKING);
    expect(related["blockedBy"]).toEqual([
      { _id: root.getId() },
      { _id: other.getId() },
    ]);
  });

  it("looks up the related records once per level, sharing the loaded linked record types between all levels", async () => {
    const owner = Object.assign(new Person(), { name: "Owner" });
    entityMapper.add(owner);
    const root = action("Root");
    const child = action("Child", {
      parent: root.getId(),
      owner: owner.getId(),
    });
    action("Grandchild", { parent: child.getId(), owner: owner.getId() });
    const loadType = vi.spyOn(entityMapper, "loadType");
    const loadLinking = vi.spyOn(
      TestBed.inject(EntityRelationsService),
      "loadLinkingToEntities",
    );

    const result = await service.loadRelatedRecords(
      template({ ...SUB_ACTIONS, levels: 3 }),
      [root],
    );

    const [loadedChild] = listOf(result.get(root.getId()));
    const [grandchild] = listOf(loadedChild);
    expect(grandchild.owner).toEqual(
      expect.objectContaining({ name: "Owner" }),
    );
    const loadsOf = (entityType: typeof Entity) =>
      loadType.mock.calls.filter(
        ([type]) => type === entityType.ENTITY_TYPE || type === entityType,
      );
    expect(loadsOf(Person)).toHaveLength(1);
    // the third level finds no more records
    expect(loadLinking).toHaveBeenCalledTimes(3);
  });

  it("still provides the other lists if loading the records of one config fails", async () => {
    const warn = vi.spyOn(Logging, "warn").mockImplementation(() => {});
    const root = action("Root");
    action("Sub", { parent: root.getId() });
    action("Waiting", { blockedBy: [root.getId()] });
    const entityRelations = TestBed.inject(EntityRelationsService);
    const loadLinking =
      entityRelations.loadLinkingToEntities.bind(entityRelations);
    vi.spyOn(entityRelations, "loadLinkingToEntities").mockImplementation(
      (ids, type, property) =>
        property === BLOCKING.property
          ? Promise.reject(new Error("failed"))
          : loadLinking(ids, type, property),
    );

    const result = await service.loadRelatedRecords(
      template(SUB_ACTIONS, BLOCKING),
      [root],
    );

    const data = result.get(root.getId());
    expect(titles(data)).toEqual(["Sub"]);
    expect(titles(data, BLOCKING)).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("adds separate lists for several configs, also through fields holding multiple links", async () => {
    const root = action("Root");
    action("Sub", { parent: root.getId() });
    action("Waiting", { blockedBy: ["RelatedRecordsAction:x", root.getId()] });

    const result = await service.loadRelatedRecords(
      template(SUB_ACTIONS, BLOCKING),
      [root],
    );

    const data = result.get(root.getId());
    expect(titles(data)).toEqual(["Sub"]);
    expect(titles(data, BLOCKING)).toEqual(["Waiting"]);
  });

  it("nests the related records of related records up to the configured number of levels", async () => {
    const root = action("Root");
    const child = action("Child", { parent: root.getId() });
    const grandchild = action("Grandchild", { parent: child.getId() });
    action("Great-grandchild", { parent: grandchild.getId() });
    action("Sibling", { parent: root.getId() });

    const result = await service.loadRelatedRecords(
      template({ ...SUB_ACTIONS, levels: 2 }),
      [root],
    );

    expect(titles(result.get(root.getId()))).toEqual([
      // the deepest loaded level does not get a (misleadingly empty) list of its own
      ["Child", ["Grandchild"]],
      ["Sibling", []],
    ]);
  });

  it("does not repeat a circular hierarchy", async () => {
    const root = action("Root");
    const child = action("Child", { parent: root.getId() });
    root.parent = child.getId();

    const result = await service.loadRelatedRecords(
      template({ ...SUB_ACTIONS, levels: 5 }),
      [root],
    );

    expect(titles(result.get(root.getId()))).toEqual([["Child", []]]);
  });

  it("only loads records for the exported record types that the configured field links to", async () => {
    const project = Object.assign(new Project(), { title: "Project" });
    const person = Object.assign(new Person(), { name: "Person" });
    action("Project action", { parent: project.getId() });

    const result = await service.loadRelatedRecords(template(SUB_ACTIONS), [
      project,
      person,
    ]);

    expect(titles(result.get(project.getId()))).toEqual(["Project action"]);
    expect(result.get(person.getId())).toEqual(relatedList(SUB_ACTIONS));
  });

  it("keeps the lists apart from the fields of the records, also of nested levels", async () => {
    const root = action("Root");
    const child = action("Child", { parent: root.getId() });
    action("Grandchild", { parent: child.getId() });

    const result = await service.loadRelatedRecords(
      template({ ...SUB_ACTIONS, levels: 2 }),
      [root],
    );

    const [related] = listOf(result.get(root.getId()));
    expect(related.parent).toEqual({ _id: root.getId() });
    expect(titles(related)).toEqual(["Grandchild"]);
  });

  it.each<[string, TemplateExportRelatedRecords, RelatedRecordsData]>([
    [
      "an unknown record type",
      { ...SUB_ACTIONS, entityType: "RemovedType" },
      relatedList({ ...SUB_ACTIONS, entityType: "RemovedType" }),
    ],
    [
      "a field that does not exist (anymore)",
      { ...SUB_ACTIONS, property: "removedField" },
      relatedList({ ...SUB_ACTIONS, property: "removedField" }),
    ],
    [
      "a field that does not link to records",
      { ...SUB_ACTIONS, property: "title" },
      relatedList({ ...SUB_ACTIONS, property: "title" }),
    ],
    [
      "a field that does not link to the applicable record types (anymore)",
      { ...SUB_ACTIONS, property: "owner" },
      relatedList({ ...SUB_ACTIONS, property: "owner" }),
    ],
    [
      "a field that cannot be used in a placeholder",
      { ...SUB_ACTIONS, property: "my field" },
      {},
    ],
  ])("skips and reports a config with %s", async (_name, config, expected) => {
    const warn = vi.spyOn(Logging, "warn").mockImplementation(() => {});
    const root = action("Root");
    action("Child", { parent: root.getId() });
    const exportTemplate = Object.assign(template(config), {
      applicableForEntityTypes: [Action.ENTITY_TYPE],
    });

    const result = await service.loadRelatedRecords(exportTemplate, [root]);
    await service.loadRelatedRecords(exportTemplate, [root]);

    expect(result.get(root.getId())).toEqual(expected);
    // reported only once, not for every generated file
    expect(warn).toHaveBeenCalledTimes(1);
  });
  it("skips and reports a config including the same related records as an earlier one", async () => {
    const warn = vi.spyOn(Logging, "warn").mockImplementation(() => {});
    const root = action("Root");
    action("Sub", { parent: root.getId() });
    action("Waiting", { blockedBy: [root.getId()] });

    const result = await service.loadRelatedRecords(
      template(SUB_ACTIONS, { ...SUB_ACTIONS, levels: 2 }),
      [root],
    );

    expect(titles(result.get(root.getId()))).toEqual(["Sub"]);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
