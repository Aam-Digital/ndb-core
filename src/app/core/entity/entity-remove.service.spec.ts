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
import { NEVER, Observable, Subject } from "rxjs";
import { Router } from "@angular/router";
import { DatabaseEntity } from "./database-entity.decorator";
import { DatabaseField } from "./database-field.decorator";
import { mockEntityMapper } from "./entity-mapper/mock-entity-mapper-service";
import { expectEntitiesToMatch } from "../../utils/expect-entity-data.spec";
import { CoreModule } from "../core.module";
import { ComponentRegistry } from "../../dynamic-components";

fdescribe("EntityRemoveService", () => {
  let service: EntityRemoveService;
  let mockedEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<TextOnlySnackBar>>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let mockRouter;

  beforeEach(() => {
    mockedEntityMapper = jasmine.createSpyObj(["remove", "save"]);
    snackBarSpy = jasmine.createSpyObj(["open"]);
    mockSnackBarRef = jasmine.createSpyObj(["onAction", "afterDismissed"]);
    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);
    snackBarSpy.open.and.returnValue(mockSnackBarRef);
    mockedEntityMapper.remove.and.resolveTo();

    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        { provide: MatSnackBar, useValue: snackBarSpy },
        Router,
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
        ComponentRegistry,
      ],
    });
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, "navigate");

    service = TestBed.inject(EntityRemoveService);
  });

  it("should return false when user cancels confirmation", async () => {
    mockConfirmationDialog.getConfirmation.and.resolveTo(false);

    const result = await service.remove(new Entity());

    expect(result).toBe(false);
    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(mockedEntityMapper.remove).not.toHaveBeenCalled();
  });

  it("should delete entity, show snackbar confirmation and navigate back", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    // mock that dialog is dismissed immediately
    const afterDismissed = new Observable<MatSnackBarDismiss>((subscriber) =>
      subscriber.next({} as MatSnackBarDismiss),
    );
    mockSnackBarRef.afterDismissed.and.returnValue(afterDismissed);

    const result = await service.remove(new Entity(), true);

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

    service.remove(entity, true);
    tick();

    mockRouter.navigate.calls.reset();
    onSnackbarAction.next();
    onSnackbarAction.complete();
    tick();

    expect(mockedEntityMapper.remove).toHaveBeenCalled();
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(entity, true);
    expect(mockRouter.navigate).toHaveBeenCalled();
  }));

  /*
   * ANONYMIZATION
   */
  @DatabaseEntity("AnonymizableEntity")
  class AnonymizableEntity extends Entity {
    @DatabaseField() defaultField: string;

    @DatabaseField({ anonymize: "retain" })
    retainedField: string;

    @DatabaseField({ anonymize: "retain-anonymized", dataType: "date-only" })
    retainAnonymizedDate: Date;

    @DatabaseField({ anonymize: "retain-anonymized", dataType: "entity-array" })
    referencesToRetainAnonymized: string[];

    static create(properties: Object) {
      return Object.assign(new AnonymizableEntity(), properties);
    }
  }

  async function testAnonymization(
    entity: AnonymizableEntity,
    entitiesBefore: any[],
    expectedEntitiesAfter: any[],
  ) {
    const entityMapper = mockEntityMapper(entitiesBefore);

    // @ts-ignore
    service.entityMapper = entityMapper;

    await service.anonymize(entity);

    const actualEntitiesAfter = entityMapper.getAllData();
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

  it("should anonymize and keep even record without any fields", async () => {
    const entity = new AnonymizableEntity();
    entity.defaultField = "test";

    await testAnonymization(entity, [entity], [AnonymizableEntity.create({})]);
  });

  it("should anonymize and remove day and month from anonymized date", async () => {
    const entity = new AnonymizableEntity();
    entity.retainAnonymizedDate = new Date("2023-09-25");

    await testAnonymization(
      entity,
      [entity],
      [
        AnonymizableEntity.create({
          retainAnonymizedDate: new Date("2023-01-01"),
        }),
      ],
    );
  });

  //
  // Anonymizing related entities
  //

  it("should anonymize and trigger a cascading anonymization for 'retain-anonymized' entity references", async () => {
    const ref1 = new AnonymizableEntity("ref-1");
    ref1.defaultField = "test-1";
    ref1.retainedField = "test-1";
    const ref2 = new AnonymizableEntity("ref-2");
    ref2.defaultField = "test-2";
    ref2.retainedField = "test-2";
    const entity = new AnonymizableEntity();
    entity.referencesToRetainAnonymized = [ref1.getId(), ref2.getId()];

    await testAnonymization(
      entity,
      [entity, ref1, ref2],
      [
        entity,
        AnonymizableEntity.create({ retainedField: "test-1" }),
        AnonymizableEntity.create({ retainedField: "test-2" }),
      ],
    );
  });
});
