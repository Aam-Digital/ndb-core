import { Injectable } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "#src/app/core/entity/entity-mapper/mock-entity-mapper-service";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";
import { Logging } from "#src/app/core/logging/logging.service";
import { WINDOW_TOKEN } from "#src/app/utils/di-tokens";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";
import { StringDatatype } from "#src/app/core/basic-datatypes/string/string.datatype";
import { DateOnlyDatatype } from "#src/app/core/basic-datatypes/date-only/date-only.datatype";
import { TranslatableTextDatatype } from "#src/app/core/config/translatable-text.datatype";
import { ExternalLinkConfig } from "./external-link-config";
import { ExternalLinksService } from "./external-links.service";

/** a datatype that cannot store its values, like a malformed field value would */
@Injectable()
class FailingDatatype extends DefaultDatatype {
  static override dataType = "external-link-test-failing";
  override transformToDatabaseFormat(): never {
    throw new Error("malformed value");
  }
}

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
    @DatabaseField({ dataType: FailingDatatype.dataType }) broken: string;
  }

  let service: ExternalLinksService;
  let entityMapper: MockEntityMapperService;
  let ability: { can: ReturnType<typeof vi.fn> };
  let windowOpen: ReturnType<typeof vi.fn>;
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
    ability = { can: vi.fn(() => true) };
    windowOpen = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        ...mockEntityMapperProvider(),
        { provide: EntityAbility, useValue: ability },
        { provide: WINDOW_TOKEN, useValue: { open: windowOpen } },
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
        { provide: DefaultDatatype, useClass: FailingDatatype, multi: true },
      ],
    });
    service = TestBed.inject(ExternalLinksService);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;

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
      entityMapper.add(createLink(values));

      const actions = await service.getActions(record);

      expect(actions.length > 0).toBe(expected);
    },
  );

  it("does not offer a link whose definition the user may not read", async () => {
    entityMapper.add(createLink({}));
    ability.can.mockImplementation(
      (action: string, subject: Entity) =>
        !(subject instanceof ExternalLinkConfig),
    );

    expect(await service.getActions(record)).toEqual([]);
  });

  it("opens the address with values of the record right on click", async () => {
    entityMapper.add(
      createLink({
        url: "https://crm.example.org/?ref={d._id}&n={d.name}&b={d.birthday}&t={d.title}&p={d.parent.name}",
      }),
    );
    record.birthday = new Date(2020, 0, 5);
    record.title = { en: "Translated" };
    const parent = new TestRecord("2");
    parent.name = "Parent";
    entityMapper.add(parent);
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
    entityMapper.addAll([createLink({}), createLink({})]);
    expect((await service.getActions(record))[0].group).toBeUndefined();

    entityMapper.add(createLink({}));

    const actions = await service.getActions(record);
    expect(actions).toHaveLength(3);
    expect(actions.every((action) => !!action.group)).toBe(true);
  });

  it("keeps the link definitions until one of them changes", async () => {
    const link = createLink({});
    entityMapper.add(link);
    const loadType = vi.spyOn(entityMapper, "loadType");
    await service.getActions(record);
    await service.getActions(record);
    expect(loadType).toHaveBeenCalledTimes(1);

    entityMapper.add(link);
    await service.getActions(record);

    expect(loadType).toHaveBeenCalledTimes(2);
  });

  it("leaves out only the links reading a field whose value cannot be read", async () => {
    vi.spyOn(Logging, "warn");
    record.broken = "malformed";
    entityMapper.addAll([
      createLink({ title: "Broken", url: "https://x.org/{d.broken}" }),
      createLink({ title: "Fine", url: "https://x.org/{d.name}" }),
    ]);

    const actions = await service.getActions(record);

    expect(actions.map((action) => action.label)).toEqual(["Fine"]);
    expect(Logging.warn).not.toHaveBeenCalled();
  });

  it("loads a linked record once for all links reading it", async () => {
    entityMapper.add(new TestRecord("2"));
    entityMapper.addAll([
      createLink({ url: "https://x.org/{d.parent.name}" }),
      createLink({ url: "https://y.org/{d.parent.name}" }),
    ]);
    const load = vi.spyOn(entityMapper, "load");

    await service.getActions(record);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("passes on the ID of a linked record that cannot be loaded", async () => {
    entityMapper.add(
      createLink({ url: "https://x.org/{d.parent._id}?n={d.parent.name}" }),
    );
    const [action] = await service.getActions(record);

    void action.execute(record);

    expect(windowOpen).toHaveBeenCalledWith(
      "https://x.org/ExternalLinkTestRecord%3A2?n=",
      "_blank",
      "noopener",
    );
  });
});
