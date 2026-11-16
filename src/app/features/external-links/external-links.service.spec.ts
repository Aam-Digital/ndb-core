import { TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";
import { EntityRelationResolverService } from "#src/app/core/entity/entity-relation-resolver/entity-relation-resolver.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";
import { WINDOW_TOKEN } from "#src/app/utils/di-tokens";
import { ExternalLinkConfig } from "./external-link-config";
import { ExternalLinksService } from "./external-links.service";

describe("ExternalLinksService", () => {
  @DatabaseEntity("ExternalLinkTestRecord")
  class TestRecord extends Entity {
    @DatabaseField() name: string;
    @DatabaseField() status: string;
    @DatabaseField({ dataType: "entity", additional: "ExternalLinkTestRecord" })
    parent: string;
  }

  let service: ExternalLinksService;
  let links: ExternalLinkConfig[];
  let updates: Subject<UpdatedEntity<ExternalLinkConfig>>;
  let entityMapper: { loadType: any; receiveUpdates: any };
  let ability: { can: any };
  let windowOpen: any;
  let resolveRelations: any;
  let record: TestRecord;

  function createLink(values: Partial<ExternalLinkConfig>): ExternalLinkConfig {
    return Object.assign(new ExternalLinkConfig(), {
      title: "CRM",
      entity: "ExternalLinkTestRecord",
      url: "https://crm.example.org/?ref={d._id}",
      ...values,
    });
  }

  beforeEach(() => {
    links = [];
    updates = new Subject();
    entityMapper = {
      loadType: vi.fn(async () => links),
      receiveUpdates: vi.fn(() => updates),
    };
    ability = { can: vi.fn(() => true) };
    windowOpen = vi.fn();
    resolveRelations = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: EntityAbility, useValue: ability },
        { provide: WINDOW_TOKEN, useValue: { open: windowOpen } },
        {
          provide: EntityRelationResolverService,
          useValue: { resolveRelations },
        },
        CurrentUserSubject,
      ],
    });
    service = TestBed.inject(ExternalLinksService);

    record = new TestRecord("1");
    record.name = "Asha & Co";
    record.status = "enrolled";
  });

  it.each([
    ["a matching link", {}, true],
    ["another record type", { entity: "Other" }, false],
    ["a matching condition", { condition: { status: "enrolled" } }, true],
    ["a condition not matching", { condition: { status: "left" } }, false],
    ["an empty condition", { condition: {} }, true],
    ["a script address", { url: "javascript:alert('{d.name}')" }, false],
    ["an address without scheme", { url: "crm.example.org/{d.name}" }, false],
    ["an unknown field", { url: "https://x.org/{d.unknown}" }, false],
    ["a formatter", { url: "https://x.org/{d.name:upperCase()}" }, false],
    ["an unknown context", { url: "https://x.org/{c.other.name}" }, false],
    ["the user's record", { url: "https://x.org/{c.user.name}" }, true],
  ] as [string, Partial<ExternalLinkConfig>, boolean][])(
    "for %s the link is offered: %s",
    async (_, values, expected) => {
      links = [createLink(values)];

      const actions = await service.getActions(record);

      expect(actions.length > 0).toBe(expected);
    },
  );

  it("does not offer a link whose definition the user may not read", async () => {
    links = [createLink({})];
    ability.can.mockImplementation(
      (action: string, subject: Entity) =>
        !(subject instanceof ExternalLinkConfig),
    );

    expect(await service.getActions(record)).toEqual([]);
  });

  it("opens the address with encoded values of the record in a new tab", async () => {
    links = [
      createLink({ url: "https://crm.example.org/?ref={d._id}&n={d.name}" }),
    ];
    const [action] = await service.getActions(record);

    await action.execute(record);

    expect(windowOpen).toHaveBeenCalledWith(
      "https://crm.example.org/?ref=ExternalLinkTestRecord%3A1&n=Asha%20%26%20Co",
      "_blank",
      "noopener",
    );
    expect(resolveRelations).not.toHaveBeenCalled();
  });

  it("loads linked records only for placeholders reading their fields", async () => {
    links = [createLink({ url: "https://x.org/{d.parent.name}" })];
    resolveRelations.mockResolvedValue({ parent: { name: "Parent" } });
    const [action] = await service.getActions(record);

    await action.execute(record);

    expect(windowOpen).toHaveBeenCalledWith(
      "https://x.org/Parent",
      "_blank",
      "noopener",
    );
  });

  it("collapses more than two links into a submenu", async () => {
    links = [createLink({}), createLink({})];
    expect((await service.getActions(record))[0].group).toBeUndefined();

    updates.next({ type: "new", entity: createLink({}) });
    links = [createLink({}), createLink({}), createLink({})];

    const actions = await service.getActions(record);
    expect(actions).toHaveLength(3);
    expect(actions.every((action) => !!action.group)).toBe(true);
  });

  it("keeps the link definitions until one of them changes", async () => {
    links = [createLink({})];
    await service.getActions(record);
    await service.getActions(record);
    expect(entityMapper.loadType).toHaveBeenCalledTimes(1);

    updates.next({ type: "update", entity: links[0] });
    await service.getActions(record);

    expect(entityMapper.loadType).toHaveBeenCalledTimes(2);
  });
});
