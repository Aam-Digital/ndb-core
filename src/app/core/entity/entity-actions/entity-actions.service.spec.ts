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

  let primaryEntity: Entity;

  beforeEach(() => {
    primaryEntity = new Entity();

    mockedEntityDeleteService = jasmine.createSpyObj(["deleteEntity"]);
    mockedEntityDeleteService.deleteEntity.and.resolveTo(
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
        { provide: EntityAnonymizeService, useValue: null },
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

    const testEntity = new Entity();
    const result = await service.delete(testEntity, true);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      testEntity,
    );
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it("should delete several entities, show snackbar confirmation and navigate back", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));

    let testEntities: Entity[] = [];
    testEntities[0] = new Entity();
    testEntities[1] = new Entity();
    testEntities[2] = new Entity();
    testEntities[3] = new Entity();
    const result = await service.delete(testEntities, true);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledTimes(4);
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      testEntities[0],
    );
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      testEntities[1],
    );
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      testEntities[2],
    );
    expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalledWith(
      testEntities[3],
    );
    expect(mockRouter.navigate).toHaveBeenCalled();
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

  // it("should archive and save a single entity", async () => {
  //   await service.archive(primaryEntity);

  //   expect(primaryEntity.isActive).toBeFalsy();
  //   expect(mockedEntityMapper.save).toHaveBeenCalledWith(primaryEntity);
  // });

  // it("should archiveUndo and save entity", async () => {
  //   await service.archive(primaryEntity);
  //   expect(primaryEntity.isActive).toBeFalse();
  //   mockedEntityMapper.save.calls.reset();

  //   await service.undoArchive(primaryEntity);

  //   expect(primaryEntity.isActive).toBeTrue();
  //   expect(mockedEntityMapper.save).toHaveBeenCalledWith(primaryEntity);
  // });
});
