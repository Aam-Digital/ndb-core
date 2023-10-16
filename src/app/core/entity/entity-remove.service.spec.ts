import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { EntityRemoveService } from "./entity-remove.service";
import { EntityMapperService } from "./entity-mapper/entity-mapper.service";
import {
  MatSnackBar,
  MatSnackBarDismiss,
  MatSnackBarRef,
  TextOnlySnackBar,
} from "@angular/material/snack-bar";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { Entity } from "./model/entity";
import { NEVER, Observable, of, Subject } from "rxjs";
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

    await service.archiveUndo(entity);

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

  async function testAnonymization(
    entity: AnonymizableEntity,
    entitiesBefore: any[],
    expectedEntitiesAfter: any[],
    checkAllBaseProperties: boolean = false,
  ) {
    const entityMapper = mockEntityMapper(entitiesBefore);

    // @ts-ignore
    service.entityMapper = entityMapper;

    await service.anonymize(entity);

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

    await testAnonymization(
      entity,
      [entity],
      [AnonymizableEntity.create({ retainedField: "test" })],
    );
  });

  it("should anonymize and keep empty record without any fields", async () => {
    const entity = new AnonymizableEntity();
    entity.defaultField = "test";

    await testAnonymization(entity, [entity], [AnonymizableEntity.create({})]);
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

    await testAnonymization(
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

    await testAnonymization(
      entity,
      [entity],
      [AnonymizableEntity.create({ inactive: true, anonymized: true })],
      true,
    );
  });

  it("should anonymize array values recursively and use datatype implementation for 'retain-anonymized", async () => {
    const entity = new AnonymizableEntity();
    entity.retainAnonymizedDates = [
      new Date("2023-09-25"),
      new Date("2023-10-04"),
    ];

    await testAnonymization(
      entity,
      [entity],
      [
        AnonymizableEntity.create({
          retainAnonymizedDates: [
            new Date("2023-07-01"),
            new Date("2023-07-01"),
          ],
        }),
      ],
    );
  });

  it("should anonymize file values, actively deleting file attachments", async () => {
    const entity = new AnonymizableEntity();
    entity.file = "test-file.txt";

    await testAnonymization(entity, [entity], [AnonymizableEntity.create({})]);
    expect(mockFileService.removeFile).toHaveBeenCalled();
  });

  //
  // Anonymizing referenced & related entities
  //

  // for direct references (e.g. x.referencesToRetainAnonymized --> recursively calls anonymize on referenced entities)
  //    see EntityDatatype & EntityArrayDatatype for unit tests

  xit("should anonymize cascadingly entities that reference the entity being anonymized", async () => {
    // TODO: cascading anonymization - see https://github.com/Aam-Digital/ndb-core/issues/220

    const entity = new AnonymizableEntity();
    entity.retainedField = "entity being anonymized";

    const ref1 = new AnonymizableEntity("ref-1");
    ref1.defaultField = "test-1";
    ref1.retainedField = "test-1";
    ref1.referencesToRetainAnonymized = [entity.getId()];

    await testAnonymization(
      entity,
      [entity, ref1],
      [
        entity,
        AnonymizableEntity.create({
          retainedField: "test-1",
          referencesToRetainAnonymized: [entity.getId()],
        }),
      ],
    );
  });
});
