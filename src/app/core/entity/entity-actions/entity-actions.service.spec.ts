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
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";

describe("EntityActionsService", () => {
  let service: EntityActionsService;
  let mockedEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<TextOnlySnackBar>>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let mockRouter;
  let mockedEntityDeleteService: jasmine.SpyObj<EntityDeleteService>;
  let mockedEntityAnonymizeService: jasmine.SpyObj<EntityAnonymizeService>;
  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;

  let singleTestEntity: Entity;
  let severalTestEntities: Entity[] = [];

  beforeEach(() => {
    singleTestEntity = new Entity();
    severalTestEntities[0] = new Entity();
    severalTestEntities[1] = new Entity();
    severalTestEntities[2] = new Entity();

    mockedEntityDeleteService = jasmine.createSpyObj(["deleteEntity"]);
    mockedEntityDeleteService.deleteEntity.and.resolveTo(
      new CascadingActionResult([singleTestEntity]),
    );
    mockedEntityAnonymizeService = jasmine.createSpyObj(["anonymizeEntity"]);
    mockedEntityAnonymizeService.anonymizeEntity.and.resolveTo(
      new CascadingActionResult([singleTestEntity]),
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
        { provide: KeycloakAuthService, useValue: mockAuthService },
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

    const result = await service.delete(singleTestEntity, true);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      singleTestEntity,
    );
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it("should delete several entities and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    const result = await service.delete(severalTestEntities);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledTimes(3);
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      severalTestEntities[0],
    );
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      severalTestEntities[1],
    );
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      severalTestEntities[2],
    );
  });

  it("should undo the deletion of several entities", fakeAsync(async () => {
    const otherAffectedEntities = [new Entity(), new Entity()];
    mockedEntityDeleteService.deleteEntity.and.resolveTo(
      new CascadingActionResult([
        ...severalTestEntities,
        ...otherAffectedEntities,
      ]),
    );

    // Mock a snackbar where 'undo' is pressed
    const onSnackbarAction = new Subject<void>();
    mockSnackBarRef.onAction.and.returnValue(onSnackbarAction.asObservable());

    mockedEntityMapper.save.and.resolveTo();

    service.delete(severalTestEntities, true);
    tick();

    mockRouter.navigate.calls.reset();
    onSnackbarAction.next();
    onSnackbarAction.complete();
    tick();

    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalled();
    expect(mockedEntityMapper.saveAll).toHaveBeenCalledWith(
      [...severalTestEntities, ...otherAffectedEntities],
      true,
    );
    expect(mockRouter.navigate).toHaveBeenCalled();
  }));

  it("should re-save all affected entities and navigate back to entity on undo", fakeAsync(() => {
    const anotherAffectedEntity = new Entity();
    mockedEntityDeleteService.deleteEntity.and.resolveTo(
      new CascadingActionResult([singleTestEntity, anotherAffectedEntity]),
    );

    // Mock a snackbar where 'undo' is pressed
    const onSnackbarAction = new Subject<void>();
    mockSnackBarRef.onAction.and.returnValue(onSnackbarAction.asObservable());

    mockedEntityMapper.save.and.resolveTo();

    service.delete(singleTestEntity, true);
    tick();

    mockRouter.navigate.calls.reset();
    onSnackbarAction.next();
    onSnackbarAction.complete();
    tick();

    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalled();
    expect(mockedEntityMapper.saveAll).toHaveBeenCalledWith(
      [singleTestEntity, anotherAffectedEntity],
      true,
    );
    expect(mockRouter.navigate).toHaveBeenCalled();
  }));

  it("should anonymize and save a single entity", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    const result = await service.anonymize(singleTestEntity);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledWith(
      singleTestEntity,
    );
  });

  it("should anonymize and save several entities and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    const result = await service.anonymize(severalTestEntities);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledTimes(
      3,
    );
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledWith(
      severalTestEntities[0],
    );
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledWith(
      severalTestEntities[1],
    );
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledWith(
      severalTestEntities[2],
    );
  });

  it("should undo the anonymization of several entities", fakeAsync(async () => {
    const otherAffectedEntities = [new Entity(), new Entity()];
    mockedEntityAnonymizeService.anonymizeEntity.and.resolveTo(
      new CascadingActionResult([
        ...severalTestEntities,
        ...otherAffectedEntities,
      ]),
    );

    // Mock a snackbar where 'undo' is pressed
    const onSnackbarAction = new Subject<void>();
    mockSnackBarRef.onAction.and.returnValue(onSnackbarAction.asObservable());

    mockedEntityMapper.save.and.resolveTo();

    service.anonymize(severalTestEntities);
    tick();

    onSnackbarAction.next();
    onSnackbarAction.complete();
    tick();

    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalled();
    expect(mockedEntityMapper.saveAll).toHaveBeenCalledWith(
      [...severalTestEntities, ...otherAffectedEntities],
      true,
    );
  }));

  it("should archive and save a single entity and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    let expectedSavedEntity = singleTestEntity.copy();
    expectedSavedEntity.inactive = true;

    const result = await service.archive(singleTestEntity);
    expect(result).toBe(true);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(expectedSavedEntity);
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it("should archive and save several entities and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    let expectedSavedEntities = severalTestEntities.map((e) => e.copy());
    expectedSavedEntities.forEach((e) => (e.inactive = true));

    const result = await service.archive(severalTestEntities);
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
    let expectedSavedEntity = singleTestEntity.copy();
    expectedSavedEntity.inactive = true;

    await service.archive(singleTestEntity);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(expectedSavedEntity);
    mockedEntityMapper.save.calls.reset();

    await service.undoArchive(singleTestEntity);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(singleTestEntity);
  });

  it("should archiveUndo and save several entities", async () => {
    let expectedSavedEntities = severalTestEntities.map((e) => e.copy());
    expectedSavedEntities.forEach((e) => (e.inactive = true));

    await service.archive(severalTestEntities);
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

    await service.undoArchive(severalTestEntities);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(
      severalTestEntities[0],
    );
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(
      severalTestEntities[1],
    );
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(
      severalTestEntities[2],
    );
  });
});
