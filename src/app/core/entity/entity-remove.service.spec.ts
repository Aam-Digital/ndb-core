import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { EntityRemoveService } from "./entity-remove.service";
import { EntityMapperService } from "./entity-mapper/entity-mapper.service";
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from "@angular/material/snack-bar";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { Entity } from "./model/entity";
import { NEVER, of, Subject } from "rxjs";
import { Router } from "@angular/router";
import { DatabaseEntity } from "./database-entity.decorator";
import { DatabaseField } from "./database-field.decorator";
import { mockEntityMapper } from "./entity-mapper/mock-entity-mapper-service";
import { expectEntitiesToMatch } from "../../utils/expect-entity-data.spec";
import { UpdateMetadata } from "./model/update-metadata";
import { FileService } from "../../features/file/file.service";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { DefaultDatatype } from "./default-datatype/default.datatype";
import { FileDatatype } from "../../features/file/file.datatype";
import moment from "moment";

describe("EntityRemoveService", () => {
  let service: EntityRemoveService;
  let mockedEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<TextOnlySnackBar>>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let mockRouter;

  beforeEach(() => {
    mockedEntityMapper = jasmine.createSpyObj(["remove", "save"]);
    snackBarSpy = jasmine.createSpyObj(["open"]);
    mockSnackBarRef = jasmine.createSpyObj(["onAction", "afterDismissed"]);
    mockSnackBarRef.onAction.and.returnValue(of());
    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);
    snackBarSpy.open.and.returnValue(mockSnackBarRef);
    mockedEntityMapper.remove.and.resolveTo();
    mockFileService = jasmine.createSpyObj(["removeFile"]);
    mockFileService.removeFile.and.returnValue(of(null));

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        EntityRemoveService,
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        { provide: MatSnackBar, useValue: snackBarSpy },
        Router,
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
        { provide: FileService, useValue: mockFileService },
        { provide: DefaultDatatype, useClass: FileDatatype, multi: true },
      ],
    });
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, "navigate");

    service = TestBed.inject(EntityRemoveService);
  });

  it("should return false when user cancels confirmation", async () => {
    mockConfirmationDialog.getConfirmation.and.resolveTo(false);

    const result = await service.delete(new Entity());

    expect(result).toBe(false);
    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(mockedEntityMapper.remove).not.toHaveBeenCalled();
  });

  it("should delete entity, show snackbar confirmation and navigate back", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    const result = await service.delete(new Entity(), true);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityMapper.remove).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it("should re-save entity and navigate back to entity on undo", fakeAsync(() => {
    const entity = new Entity();

    // Mock a snackbar where 'undo' is immediately pressed
    const onSnackbarAction = new Subject<void>();
    mockSnackBarRef.onAction.and.returnValue(onSnackbarAction.asObservable());
    mockSnackBarRef.afterDismissed.and.returnValue(NEVER);

    mockedEntityMapper.save.and.resolveTo();

    service.delete(entity, true);
    tick();

    mockRouter.navigate.calls.reset();
    onSnackbarAction.next();
    onSnackbarAction.complete();
    tick();

    expect(mockedEntityMapper.remove).toHaveBeenCalled();
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(entity, true);
    expect(mockRouter.navigate).toHaveBeenCalled();
  }));

  it("should archive and save entity", async () => {
    const entity = new Entity();

    await service.archive(entity);

    expect(entity.isActive).toBeFalse();
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(entity);
  });

  it("should archiveUndo and save entity", async () => {
    const entity = new Entity();

    await service.archive(entity);
    expect(entity.isActive).toBeFalse();
    mockedEntityMapper.save.calls.reset();

    await service.undoArchive(entity);

    expect(entity.isActive).toBeTrue();
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(entity);
  });

  /*
   * ANONYMIZATION
   */
  @DatabaseEntity("AnonymizableEntity")
  class AnonymizableEntity extends Entity {
    @DatabaseField() defaultField: string;

    @DatabaseField({ anonymize: "retain" })
    retainedField: string;

    @DatabaseField({
      anonymize: "retain-anonymized",
      dataType: "array",
      innerDataType: "date-only",
    })
    retainAnonymizedDates: Date[];

    @DatabaseField({ dataType: "file" }) file: string;

    @DatabaseField({ anonymize: "retain-anonymized", dataType: "entity-array" })
    referencesToRetainAnonymized: string[];

    static create(properties: Partial<AnonymizableEntity>) {
      return Object.assign(new AnonymizableEntity(), properties);
    }
  }

  async function testAction(
    action: "anonymize" | "delete",
    entity: Entity,
    entitiesBefore: any[],
    expectedEntitiesAfter: any[],
    checkAllBaseProperties: boolean = false,
  ) {
    const entityMapper = mockEntityMapper(entitiesBefore);

    // @ts-ignore
    service.entityMapper = entityMapper;

    await service[action](entity);

    const actualEntitiesAfter = entityMapper.getAllData();

    if (!checkAllBaseProperties) {
      actualEntitiesAfter.forEach((e) => {
        delete e.inactive;
        delete e.anonymized;
      });
    }

    expectEntitiesToMatch(actualEntitiesAfter, expectedEntitiesAfter, true);
  }

  it("should anonymize and only keep properties marked to be retained", async () => {
    const entity = new AnonymizableEntity();
    entity.defaultField = "test";
    entity.retainedField = "test";

    await testAction(
      "anonymize",
      entity,
      [entity],
      [AnonymizableEntity.create({ retainedField: "test" })],
    );
  });

  it("should anonymize and keep empty record without any fields", async () => {
    const entity = new AnonymizableEntity();
    entity.defaultField = "test";

    await testAction(
      "anonymize",
      entity,
      [entity],
      [AnonymizableEntity.create({})],
    );
  });

  it("should anonymize and retain created and updated", async () => {
    const entityProperties = {
      created: new UpdateMetadata("CREATOR", new Date("2020-01-01")),
      updated: new UpdateMetadata("UPDATER", new Date("2020-01-02")),
    };
    const entity = AnonymizableEntity.create({
      defaultField: "test",
      ...entityProperties,
    });

    await testAction(
      "anonymize",
      entity,
      [entity],
      [
        AnonymizableEntity.create({
          inactive: true,
          anonymized: true,
          ...entityProperties,
        }),
      ],
      true,
    );
  });

  it("should mark anonymized entities as inactive", async () => {
    const entity = new AnonymizableEntity();
    entity.defaultField = "test";

    await testAction(
      "anonymize",
      entity,
      [entity],
      [AnonymizableEntity.create({ inactive: true, anonymized: true })],
      true,
    );
  });

  it("should anonymize array values recursively and use datatype implementation for 'retain-anonymized", async () => {
    const entity = new AnonymizableEntity();
    entity.retainAnonymizedDates = [
      moment("2023-09-25").toDate(),
      moment("2023-10-04").toDate(),
    ];

    await testAction(
      "anonymize",
      entity,
      [entity],
      [
        AnonymizableEntity.create({
          retainAnonymizedDates: [
            moment("2023-07-01").toDate(),
            moment("2023-07-01").toDate(),
          ],
        }),
      ],
    );
  });

  it("should anonymize file values, actively deleting file attachments", async () => {
    const entity = new AnonymizableEntity();
    entity.file = "test-file.txt";

    await testAction(
      "anonymize",
      entity,
      [entity],
      [AnonymizableEntity.create({})],
    );
    expect(mockFileService.removeFile).toHaveBeenCalled();
  });

  //
  // Deleting/Anonymizing referenced & related entities
  //    -> https://github.com/Aam-Digital/ndb-core/issues/220#issuecomment-1740656623
  //    we distinguish different roles / relations between entities:
  //     ♢ "aggregate" (has-a): both entities have meaning independently
  //     ♦ "composite" (is-part-of): the entity holding the reference is only meaningful in the context of the referenced

  @DatabaseEntity("RelatedEntity")
  class RelatedEntity extends Entity {
    @DatabaseField() name: string;

    @DatabaseField({
      dataType: "entity-array",
      additional: "RelatedEntity",
      anonymize: "retain",
    })
    refAggregate: string[];

    @DatabaseField({
      dataType: "entity-array",
      additional: "RelatedEntity",
      anonymize: "retain",
    })
    refComposite: string[];

    static create(name: string, properties?: Partial<RelatedEntity>) {
      return Object.assign(new RelatedEntity(), { name: name, ...properties });
    }
  }

  // for direct references (e.g. x.referencesToRetainAnonymized --> recursively calls anonymize on referenced entities)
  //    see EntityDatatype & EntityArrayDatatype for unit tests
  // TODO: should we allow an additional option to delete a direct referenced entity completely during anonymization?

  fit("should not cascade delete the related entity if the entity holding the reference is deleted", async () => {
    const entity2 = RelatedEntity.create("other entity");
    const entity = RelatedEntity.create("entity user acts on", {
      refComposite: [entity2.getId()],
    });

    await testAction("delete", entity, [entity, entity2], [entity2]);
  });
  it("should not cascade anonymize the related entity if the entity holding the reference is anonymized", async () => {
    const entity2 = RelatedEntity.create("other entity");
    const entity = RelatedEntity.create("entity user acts on", {
      refComposite: [entity2.getId()],
    });

    await testAction(
      "anonymize",
      entity,
      [entity, entity2],
      [RelatedEntity.create(undefined), entity2],
    );
  });

  fit("should cascade delete the 'composite'-type entity that references the entity user acts on", async () => {
    const entity = RelatedEntity.create("entity user acts on");

    const ref1 = RelatedEntity.create("ref", {
      refComposite: [entity.getId()],
    });

    await testAction("delete", entity, [entity, ref1], []);
  });
  it("should cascade anonymize the 'composite'-type entity that references the entity user acts on", async () => {
    const entity = RelatedEntity.create("entity user acts on");

    const ref1 = RelatedEntity.create("ref", {
      refComposite: [entity.getId()],
    });

    await testAction(
      "anonymize",
      entity,
      [entity, ref1],
      [
        RelatedEntity.create(undefined),
        RelatedEntity.create(undefined, { refComposite: [entity.getId()] }),
      ],
    );
  });

  fit("should not cascade delete the 'composite'-type entity that still references additional other entities but remove id", async () => {
    const entity = RelatedEntity.create("entity user acts on");
    const entity2 = RelatedEntity.create("other entity");

    const ref1 = RelatedEntity.create("ref", {
      refComposite: [entity.getId(), entity2.getId()],
    });

    // TODO: does this case require manual review / confirmation by the user?
    await testAction(
      "delete",
      entity,
      [entity, entity2, ref1],
      [
        entity2,
        RelatedEntity.create("ref", { refComposite: [entity2.getId()] }),
      ],
    );
  });
  it("should not cascade anonymize the 'composite'-type entity that still references additional other entities but ask user", async () => {
    const entity = RelatedEntity.create("entity user acts on");
    const entity2 = RelatedEntity.create("other entity");

    const ref1 = RelatedEntity.create("ref", {
      refComposite: [entity.getId(), entity2.getId()],
    });

    await testAction(
      "anonymize",
      entity,
      [entity, entity2, ref1],
      [
        RelatedEntity.create(undefined),
        entity2,
        // TODO: require manual review / confirmation by the user?
        RelatedEntity.create("ref", { refComposite: [entity2.getId()] }),
      ],
    );
  });

  fit("should cascade delete the 'composite'-type entity that references the entity user acts on even when another property holds other id (e.g. ChildSchoolRelation)", async () => {
    const entity = RelatedEntity.create("entity user acts on");
    const entity2 = RelatedEntity.create("other entity");

    const ref1 = RelatedEntity.create("ref", {
      refComposite: [entity.getId()],
      refAggregate: [entity2.getId()],
    });

    await testAction("delete", entity, [entity, ref1, entity2], [entity2]);
  });
  it("should cascade anonymize the 'composite'-type entity that references the entity user acts on even when another property holds other id (e.g. ChildSchoolRelation)", async () => {
    const entity = RelatedEntity.create("entity user acts on");
    const entity2 = RelatedEntity.create("other entity");

    const ref1 = RelatedEntity.create("ref", {
      refComposite: [entity.getId()],
      refAggregate: [entity2.getId()],
    });

    await testAction(
      "anonymize",
      entity,
      [entity, ref1, entity2],
      [
        RelatedEntity.create(undefined),
        RelatedEntity.create(undefined, {
          refComposite: [entity.getId()],
          refAggregate: [entity2.getId()],
        }),
        entity2,
      ],
    );
  });

  fit("should not cascade delete the 'aggregate'-type entity that only references the entity user acts on but remove id", async () => {
    const entity = RelatedEntity.create("entity user acts on");
    const ref1 = RelatedEntity.create("ref", {
      refAggregate: [entity.getId()],
    });

    // TODO: does this case require manual review / confirmation by the user?
    await testAction(
      "delete",
      entity,
      [entity, ref1],
      [RelatedEntity.create("ref", { refAggregate: [] })],
    );
  });
  it("should not cascade anonymize the 'aggregate'-type entity that only references the entity user acts on but ask user", async () => {
    const entity = RelatedEntity.create("entity user acts on");
    const ref1 = RelatedEntity.create("ref", {
      refAggregate: [entity.getId()],
    });

    // TODO: require manual review / confirmation by the user?
    await testAction(
      "anonymize",
      entity,
      [entity, ref1],
      [
        RelatedEntity.create(undefined),
        RelatedEntity.create("ref", { refAggregate: [] }),
      ],
    );
  });

  fit("should not cascade delete the 'aggregate'-type entity that still references additional other entities but remove id", async () => {
    const entity = RelatedEntity.create("entity user acts on");
    const entity2 = RelatedEntity.create("other entity");

    const ref1 = RelatedEntity.create("ref", {
      refAggregate: [entity.getId(), entity2.getId()],
    });

    await testAction(
      "delete",
      entity,
      [entity, entity2, ref1],
      [
        entity2,
        RelatedEntity.create("ref", { refAggregate: [entity2.getId()] }),
      ],
    );
  });
  it("should not cascade anonymize the 'aggregate'-type entity that still references additional other entities but ask user", async () => {
    const entity = RelatedEntity.create("entity user acts on");
    const entity2 = RelatedEntity.create("other entity");

    const ref1 = RelatedEntity.create("ref", {
      refAggregate: [entity.getId(), entity2.getId()],
    });

    await testAction(
      "anonymize",
      entity,
      [entity, entity2, ref1],
      [
        RelatedEntity.create(undefined),
        entity2,
        // TODO: require manual review / confirmation by the user?
        RelatedEntity.create("ref", { refAggregate: [entity2.getId()] }),
      ],
    );
  });

  // TODO: warn user that related entities are affected
});
