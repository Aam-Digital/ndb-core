import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { EntityActionsService } from "./entity-actions.service";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from "@angular/material/snack-bar";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { Entity } from "../model/entity";
import { NEVER, of, Subject } from "rxjs";
import { Router } from "@angular/router";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityDeleteService } from "./entity-delete.service";
import { EntityAnonymizeService } from "./entity-anonymize.service";
import { CascadingActionResult } from "./cascading-entity-action";

describe("EntityActionsService", () => {
  let service: EntityActionsService;
  let mockedEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<TextOnlySnackBar>>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let mockRouter;
  let mockedEntityDeleteService: jasmine.SpyObj<EntityDeleteService>;
  let mockedEntityAnonymizeService: jasmine.SpyObj<EntityAnonymizeService>;

  let primaryEntity: Entity;
  let testEntities: Entity[] = [];

  beforeEach(() => {
    primaryEntity = new Entity();
    testEntities[0] = new Entity();
    testEntities[1] = new Entity();
    testEntities[2] = new Entity();

    mockedEntityDeleteService = jasmine.createSpyObj(["deleteEntity"]);
    mockedEntityDeleteService.deleteEntity.and.resolveTo(
      new CascadingActionResult([primaryEntity]),
    );
    mockedEntityAnonymizeService = jasmine.createSpyObj(["anonymizeEntity"]);
    mockedEntityAnonymizeService.anonymizeEntity.and.resolveTo(
      new CascadingActionResult([primaryEntity]),
    );
    mockedEntityMapper = jasmine.createSpyObj(["save", "saveAll"]);

    snackBarSpy = jasmine.createSpyObj(["open"]);
    mockSnackBarRef = jasmine.createSpyObj(["onAction", "afterDismissed"]);
    mockSnackBarRef.onAction.and.returnValue(of());
    snackBarSpy.open.and.returnValue(mockSnackBarRef);

    mockConfirmationDialog = jasmine.createSpyObj([
      "getConfirmation",
      "showProgressDialog",
    ]);
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);
    mockConfirmationDialog.showProgressDialog.and.returnValue(
      jasmine.createSpyObj(["close"]),
    );

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        EntityActionsService,
        { provide: EntityDeleteService, useValue: mockedEntityDeleteService },
        {
          provide: EntityAnonymizeService,
          useValue: mockedEntityAnonymizeService,
        },
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        { provide: MatSnackBar, useValue: snackBarSpy },
        Router,
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    });
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, "navigate");

    service = TestBed.inject(EntityActionsService);
  });

  it("should return false when user cancels confirmation", async () => {
    mockConfirmationDialog.getConfirmation.and.resolveTo(false);

    const result = await service.delete(new Entity());

    expect(result).toBe(false);
    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(mockedEntityDeleteService.deleteEntity).not.toHaveBeenCalled();
  });

  it("should delete a single entity, show snackbar confirmation and navigate back", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    const result = await service.delete(primaryEntity, true);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      primaryEntity,
    );
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it("should delete several entities and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    const result = await service.delete(testEntities);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledTimes(3);
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      testEntities[0],
    );
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      testEntities[1],
    );
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      testEntities[2],
    );
  });

  it("should re-save all affected entities and navigate back to entity on undo", fakeAsync(() => {
    const anotherAffectedEntity = new Entity();
    mockedEntityDeleteService.deleteEntity.and.resolveTo(
      new CascadingActionResult([primaryEntity, anotherAffectedEntity]),
    );

    // Mock a snackbar where 'undo' is pressed
    const onSnackbarAction = new Subject<void>();
    mockSnackBarRef.onAction.and.returnValue(onSnackbarAction.asObservable());

    mockedEntityMapper.save.and.resolveTo();

    service.delete(primaryEntity, true);
    tick();

    mockRouter.navigate.calls.reset();
    onSnackbarAction.next();
    onSnackbarAction.complete();
    tick();

    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalled();
    expect(mockedEntityMapper.saveAll).toHaveBeenCalledWith(
      [primaryEntity, anotherAffectedEntity],
      true,
    );
    expect(mockRouter.navigate).toHaveBeenCalled();
  }));

  it("should anonymize and save a single entity", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    const result = await service.anonymize(primaryEntity);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledWith(
      primaryEntity,
    );
  });

  it("should anonymize and save several entities and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    const result = await service.anonymize(testEntities);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledTimes(
      3,
    );
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledWith(
      testEntities[0],
    );
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledWith(
      testEntities[1],
    );
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledWith(
      testEntities[2],
    );
  });

  it("should archive and save a single entity and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    let expectedSavedEntity = primaryEntity.copy();
    expectedSavedEntity.inactive = true;

    const result = await service.archive(primaryEntity);
    expect(result).toBe(true);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(expectedSavedEntity);
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it("should archive and save several entities and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    let expectedSavedEntities = testEntities.map((e) => e.copy());
    expectedSavedEntities.forEach((e) => (e.inactive = true));

    const result = await service.archive(testEntities);
    expect(result).toBe(true);
    expect(mockedEntityMapper.save).toHaveBeenCalledTimes(3);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(
      expectedSavedEntities[0],
    );
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(
      expectedSavedEntities[1],
    );
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(
      expectedSavedEntities[2],
    );
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it("should archiveUndo and save a single entity", async () => {
    let expectedSavedEntity = primaryEntity.copy();
    expectedSavedEntity.inactive = true;

    await service.archive(primaryEntity);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(expectedSavedEntity);
    mockedEntityMapper.save.calls.reset();

    await service.undoArchive(primaryEntity);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(primaryEntity);
  });

  it("should archiveUndo and save several entities", async () => {
    let expectedSavedEntities = testEntities.map((e) => e.copy());
    expectedSavedEntities.forEach((e) => (e.inactive = true));

    await service.archive(testEntities);
    expect(mockedEntityMapper.save).toHaveBeenCalledTimes(3);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(
      expectedSavedEntities[0],
    );
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(
      expectedSavedEntities[1],
    );
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(
      expectedSavedEntities[2],
    );
    mockedEntityMapper.save.calls.reset();

    await service.undoArchive(testEntities);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(testEntities[0]);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(testEntities[1]);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(testEntities[2]);
  });
});
