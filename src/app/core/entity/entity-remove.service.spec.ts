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
import { NEVER, Observable, Subject } from "rxjs";
import { MatDialogRef } from "@angular/material/dialog";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { toArray } from "rxjs/operators";

describe("EntityRemoveService", () => {
  let service: EntityRemoveService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<TextOnlySnackBar>>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ConfirmationDialogComponent>>;
  let afterClosed: Subject<boolean>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["remove", "save"]);
    snackBarSpy = jasmine.createSpyObj(["open"]);
    mockSnackBarRef = jasmine.createSpyObj(["onAction", "afterDismissed"]);
    mockConfirmationDialog = jasmine.createSpyObj(["openDialog"]);
    mockDialogRef = jasmine.createSpyObj(["afterClosed"]);
    afterClosed = new Subject<boolean>();
    mockDialogRef.afterClosed.and.returnValue(afterClosed);
    mockConfirmationDialog.openDialog.and.returnValue(mockDialogRef);
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

  afterEach(() => {
    afterClosed.complete();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("emits once and closes when the user has cancelled", (done) => {
    service
      .remove(new Entity())
      .pipe(toArray())
      .subscribe(
        (next) => {
          expect(next).toEqual([RemoveResult.CANCELLED]);
        },
        () => {
          // intentionally empty
        },
        () => {
          expect(snackBarSpy.open).not.toHaveBeenCalled();
          expect(mockEntityMapper.remove).not.toHaveBeenCalled();
          done();
        }
      );
    afterClosed.next(false);
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
      .subscribe(
        (next) => {
          expect(next).toEqual([RemoveResult.REMOVED]);
        },
        () => {
          // intentionally empty
        },
        () => {
          expect(snackBarSpy.open).toHaveBeenCalled();
          expect(mockEntityMapper.remove).toHaveBeenCalled();
          done();
        }
      );
    afterClosed.next(true);
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
      .subscribe(
        (next) => {
          expect(next).toEqual([RemoveResult.REMOVED, RemoveResult.UNDONE]);
        },
        () => {
          // intentionally empty
        },
        () => {
          expect(mockEntityMapper.remove).toHaveBeenCalled();
          expect(mockEntityMapper.save).toHaveBeenCalledWith(entity, true);
          done();
        }
      );
    afterClosed.next(true);
  });
});
