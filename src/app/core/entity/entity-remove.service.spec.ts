import { TestBed } from "@angular/core/testing";
import { EntityRemoveService, RemoveResult } from "./entity-remove.service";
import { EntityMapperService } from "./entity-mapper.service";
import {
  MatSnackBar,
  MatSnackBarDismiss,
  MatSnackBarRef,
  TextOnlySnackBar,
} from "@angular/material/snack-bar";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { Entity } from "./model/entity";
import { NEVER, Observable } from "rxjs";
import { toArray } from "rxjs/operators";

describe("EntityRemoveService", () => {
  let service: EntityRemoveService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<TextOnlySnackBar>>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

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
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    });
    service = TestBed.inject(EntityRemoveService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("emits once and closes when the user has cancelled", (done) => {
    mockConfirmationDialog.getConfirmation.and.resolveTo(false);
    service
      .remove(new Entity())
      .pipe(toArray())
      .subscribe({
        next: (next) => {
          expect(next).toEqual([RemoveResult.CANCELLED]);
        },
        complete: () => {
          expect(snackBarSpy.open).not.toHaveBeenCalled();
          expect(mockEntityMapper.remove).not.toHaveBeenCalled();
          done();
        },
      });
  });

  it("deletes the entity and finishes if the action is never undone", (done) => {
    // onAction is never called
    mockSnackBarRef.onAction.and.returnValues(NEVER);
    // mock that dialog is dismissed immediately
    const afterDismissed = new Observable<MatSnackBarDismiss>((subscriber) =>
      subscriber.next({} as MatSnackBarDismiss)
    );
    mockSnackBarRef.afterDismissed.and.returnValue(afterDismissed);
    service
      .remove(new Entity())
      .pipe(toArray())
      .subscribe({
        next: (next) => {
          expect(next).toEqual([RemoveResult.REMOVED]);
        },
        complete: () => {
          expect(snackBarSpy.open).toHaveBeenCalled();
          expect(mockEntityMapper.remove).toHaveBeenCalled();
          done();
        },
      });
  });

  it("emits twice when an entity was deleted and the user pressed undo", (done) => {
    // Mock a snackbar where 'undo' is immediately pressed
    const onSnackbarAction = new Observable<void>((subscriber) =>
      subscriber.next()
    );
    mockSnackBarRef.onAction.and.returnValue(onSnackbarAction);
    mockSnackBarRef.afterDismissed.and.returnValue(NEVER);
    mockEntityMapper.save.and.resolveTo();
    const entity = new Entity();
    service
      .remove(entity)
      .pipe(toArray())
      .subscribe({
        next: (next) => {
          expect(next).toEqual([RemoveResult.REMOVED, RemoveResult.UNDONE]);
        },
        complete: () => {
          expect(mockEntityMapper.remove).toHaveBeenCalled();
          expect(mockEntityMapper.save).toHaveBeenCalledWith(entity, true);
          done();
        },
      });
  });
});
