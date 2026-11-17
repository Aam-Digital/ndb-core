import { TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";
import { WINDOW_TOKEN } from "#src/app/utils/di-tokens";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";
import { StringDatatype } from "#src/app/core/basic-datatypes/string/string.datatype";
import { DateOnlyDatatype } from "#src/app/core/basic-datatypes/date-only/date-only.datatype";
import { TranslatableTextDatatype } from "#src/app/core/config/translatable-text.datatype";
import { ExternalLinkConfig } from "./external-link-config";
import { ExternalLinksService } from "./external-links.service";

describe("ExternalLinksService", () => {
  @DatabaseEntity("ExternalLinkTestRecord")
  class TestRecord extends Entity {
    @DatabaseField() name: string;
    @DatabaseField() status: string;
    @DatabaseField({ dataType: "entity", additional: "ExternalLinkTestRecord" })
    parent: string;
    @DatabaseField({
      dataType: "entity",
      additional: "ExternalLinkTestRecord",
      isArray: true,
    })
    children: string[];
    @DatabaseField({ dataType: "date-only" }) birthday: Date;
    @DatabaseField({ dataType: "translatable-text" }) title: unknown;
  }

  let service: ExternalLinksService;
  let links: ExternalLinkConfig[];
  let updates: Subject<UpdatedEntity<ExternalLinkConfig>>;
  let entityMapper: { loadType: any; receiveUpdates: any; load: any };
  let ability: { can: any };
  let windowOpen: any;
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
      load: vi.fn(async () => undefined),
    };
    ability = { can: vi.fn(() => true) };
    windowOpen = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: EntityAbility, useValue: ability },
        { provide: WINDOW_TOKEN, useValue: { open: windowOpen } },
        CurrentUserSubject,
        { provide: EntityRegistry, useValue: entityRegistry },
        EntitySchemaService,
        // only the datatypes of the fields these tests read
        { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
        { provide: DefaultDatatype, useClass: DateOnlyDatatype, multi: true },
        {
          provide: DefaultDatatype,
          useClass: TranslatableTextDatatype,
          multi: true,
        },
      ],
    });
    service = TestBed.inject(ExternalLinksService);

    record = new TestRecord("1");
    record.name = "Asha & Co";
    record.status = "enrolled";
    record.parent = "ExternalLinkTestRecord:2";
    record.children = ["ExternalLinkTestRecord:2"];

    const user = new TestRecord("user");
    user.name = "Test User";
    TestBed.inject(CurrentUserSubject).next(user);
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
    [
      "an unknown field of the user",
      { url: "https://x.org/{c.user.x}" },
      false,
    ],
    ["a linked record's field", { url: "https://x.org/{d.parent.name}" }, true],
    [
      "a linked record's unknown field",
      { url: "https://x.org/{d.parent.x}" },
      false,
    ],
    [
      "a field of linked records",
      { url: "https://x.org/{d.children.name}" },
      false,
    ],
    ["a key below a plain field", { url: "https://x.org/{d.name.x}" }, false],
    [
      "a path deeper than a linked record",
      { url: "https://x.org/{d.parent.parent.name}" },
      false,
    ],
    ["an upper-case scheme", { url: "HTTPS://x.org/{d.name}" }, false],
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

  it("opens the address with values of the record right on click", async () => {
    links = [
      createLink({
        url: "https://crm.example.org/?ref={d._id}&n={d.name}&b={d.birthday}&t={d.title}&p={d.parent.name}",
      }),
    ];
    record.birthday = new Date(2020, 0, 5);
    record.title = { en: "Translated" };
    const parent = new TestRecord("2");
    parent.name = "Parent";
    entityMapper.load.mockResolvedValue(parent);
    const [action] = await service.getActions(record);

    // not awaited: browsers block a new tab that is opened after waiting for data
    void action.execute(record);

    expect(windowOpen).toHaveBeenCalledWith(
      "https://crm.example.org/?ref=ExternalLinkTestRecord%3A1&n=Asha%20%26%20Co&b=2020-01-05&t=Translated&p=Parent",
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
