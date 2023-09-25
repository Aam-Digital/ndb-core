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

describe("EntityRemoveService", () => {
  let service: EntityRemoveService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<TextOnlySnackBar>>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let mockRouter;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["remove", "save"]);
    snackBarSpy = jasmine.createSpyObj(["open"]);
    mockSnackBarRef = jasmine.createSpyObj(["onAction", "afterDismissed"]);
    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);
    snackBarSpy.open.and.returnValue(mockSnackBarRef);
    mockEntityMapper.remove.and.resolveTo();
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
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

    service = TestBed.inject(EntityRemoveService);
  });

  it("should return false when user cancels confirmation", async () => {
    mockConfirmationDialog.getConfirmation.and.resolveTo(false);

    const result = await service.remove(new Entity());

    expect(result).toBe(false);
    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(mockEntityMapper.remove).not.toHaveBeenCalled();
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
    expect(mockEntityMapper.remove).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it("should re-save entity and navigate back to entity on undo", fakeAsync(() => {
    const entity = new Entity();

    // Mock a snackbar where 'undo' is immediately pressed
    const onSnackbarAction = new Subject<void>();
    mockSnackBarRef.onAction.and.returnValue(onSnackbarAction.asObservable());
    mockSnackBarRef.afterDismissed.and.returnValue(NEVER);

    mockEntityMapper.save.and.resolveTo();

    service.remove(entity, true);
    tick();

    mockRouter.navigate.calls.reset();
    onSnackbarAction.next();
    onSnackbarAction.complete();
    tick();

    expect(mockEntityMapper.remove).toHaveBeenCalled();
    expect(mockEntityMapper.save).toHaveBeenCalledWith(entity, true);
    expect(mockRouter.navigate).toHaveBeenCalled();
  }));
});
