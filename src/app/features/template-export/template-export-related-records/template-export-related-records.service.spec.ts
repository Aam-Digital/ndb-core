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
    static override toStringAttributes = ["title"];

    @DatabaseField() title: string;
  }

  @DatabaseEntity("RelatedRecordsPerson")
  class Person extends Entity {
    @DatabaseField() name: string;
  }

  /** a record type forming a hierarchy among itself, that can also be linked to a project */
  @DatabaseEntity("RelatedRecordsAction")
  class Action extends Entity {
    static override toStringAttributes = ["title"];

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

  const SUB_ACTIONS: TemplateExportRelatedRecords = {
    key: "subActions",
    entityType: "RelatedRecordsAction",
    property: "parent",
  };

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

  /** the titles of the related records under the given key, including those of nested levels */
  function titles(data: RelatedRecordsData | Record<string, any>, key: string) {
    return (data?.[key] as Record<string, any>[])?.map((record) =>
      record[key] ? [record.title, titles(record, key)] : record.title,
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

    expect(titles(result.get(rootA.getId()), "subActions")).toEqual([
      "Step 2",
      "Step 10",
    ]);
    // an empty list rather than no list, so that a loop in the template prints nothing
    expect(result.get(rootB.getId())).toEqual({ subActions: [] });
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

    const [related] = result.get(root.getId()).subActions;
    expect(related).toEqual(
      expect.objectContaining({
        title: "Step",
        owner: expect.objectContaining({ name: "Olivia" }),
      }),
    );
    expect(related).not.toBe(step);
    expect(step.owner).toBe(owner.getId());
  });

  it("keeps only the id of the record a related record is listed under, but resolves its other links", async () => {
    const root = action("Root");
    const other = action("Other");
    action("Waiting", { blockedBy: [root.getId(), other.getId()] });

    const result = await service.loadRelatedRecords(
      template({
        key: "blocking",
        entityType: "RelatedRecordsAction",
        property: "blockedBy",
      }),
      [root],
    );

    const [related] = result.get(root.getId()).blocking;
    expect(related["blockedBy"]).toEqual([
      { _id: root.getId() },
      expect.objectContaining({ title: "Other" }),
    ]);
  });

  it("loads all records of the type only once for all levels if the database answers no queries", async () => {
    const root = action("Root");
    const child = action("Child", { parent: root.getId() });
    action("Grandchild", { parent: child.getId() });
    const loadLinking = vi.spyOn(
      TestBed.inject(EntityRelationsService),
      "loadLinkingToEntities",
    );

    const result = await service.loadRelatedRecords(
      template({ ...SUB_ACTIONS, levels: 3 }),
      [root],
    );

    expect(titles(result.get(root.getId()), "subActions")).toEqual([
      ["Child", [["Grandchild", []]]],
    ]);
    const preloaded = loadLinking.mock.calls.map((call) => call[3]);
    expect(preloaded).toHaveLength(3);
    expect(new Set(preloaded).size).toBe(1);
    expect(preloaded[0]).toEqual(expect.arrayContaining([child]));
  });

  it("adds separate lists for several configs, also through fields holding multiple links", async () => {
    const root = action("Root");
    action("Sub", { parent: root.getId() });
    action("Waiting", { blockedBy: ["RelatedRecordsAction:x", root.getId()] });

    const result = await service.loadRelatedRecords(
      template(SUB_ACTIONS, {
        key: "blocking",
        entityType: "RelatedRecordsAction",
        property: "blockedBy",
      }),
      [root],
    );

    const data = result.get(root.getId());
    expect(titles(data, "subActions")).toEqual(["Sub"]);
    expect(titles(data, "blocking")).toEqual(["Waiting"]);
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

    expect(titles(result.get(root.getId()), "subActions")).toEqual([
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

    expect(titles(result.get(root.getId()), "subActions")).toEqual([
      ["Child", []],
    ]);
  });

  it("only loads records for the exported record types that the configured field links to", async () => {
    const project = Object.assign(new Project(), { title: "Project" });
    const person = Object.assign(new Person(), { name: "Person" });
    action("Project action", { parent: project.getId() });

    const result = await service.loadRelatedRecords(template(SUB_ACTIONS), [
      project,
      person,
    ]);

    expect(titles(result.get(project.getId()), "subActions")).toEqual([
      "Project action",
    ]);
    expect(result.get(person.getId())).toEqual({ subActions: [] });
  });

  it.each<[string, TemplateExportRelatedRecords, RelatedRecordsData]>([
    [
      "an unknown record type",
      { ...SUB_ACTIONS, entityType: "RemovedType" },
      { subActions: [] },
    ],
    [
      "a field that does not exist (anymore)",
      { ...SUB_ACTIONS, property: "removedField" },
      { subActions: [] },
    ],
    [
      "a field that does not link to records",
      { ...SUB_ACTIONS, property: "title" },
      { subActions: [] },
    ],
    // the list must not replace the value of an actual field of the record
    [
      "a placeholder name of an existing field",
      { ...SUB_ACTIONS, key: "title" },
      {},
    ],
    ["an invalid placeholder name", { ...SUB_ACTIONS, key: "sub actions" }, {}],
  ])("skips and reports a config with %s", async (_name, config, expected) => {
    const warn = vi.spyOn(Logging, "warn").mockImplementation(() => {});
    const root = action("Root");
    action("Child", { parent: root.getId() });
    const exportTemplate = template(config);

    const result = await service.loadRelatedRecords(exportTemplate, [root]);
    await service.loadRelatedRecords(exportTemplate, [root]);

    expect(result.get(root.getId())).toEqual(expected);
    // reported only once, not for every generated file
    expect(warn).toHaveBeenCalledTimes(1);
  });
  it("skips and reports a config using the placeholder name of an earlier one", async () => {
    const warn = vi.spyOn(Logging, "warn").mockImplementation(() => {});
    const root = action("Root");
    action("Sub", { parent: root.getId() });
    action("Waiting", { blockedBy: [root.getId()] });

    const result = await service.loadRelatedRecords(
      template(SUB_ACTIONS, { ...SUB_ACTIONS, property: "blockedBy" }),
      [root],
    );

    expect(titles(result.get(root.getId()), "subActions")).toEqual(["Sub"]);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
