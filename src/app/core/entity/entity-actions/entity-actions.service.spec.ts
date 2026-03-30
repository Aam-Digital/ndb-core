import { TestBed } from "@angular/core/testing";
import { EntityActionsService } from "./entity-actions.service";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from "@angular/material/snack-bar";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { Entity } from "../model/entity";
import { NEVER, Observable, of, Subject } from "rxjs";
import { Router } from "@angular/router";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityDeleteService } from "./entity-delete.service";
import { EntityAnonymizeService } from "./entity-anonymize.service";
import { CascadingActionResult } from "./cascading-entity-action";
import { PublicFormsService } from "app/features/public-form/public-forms.service";
import { BulkOperationStateService } from "./bulk-operation-state.service";
import type { Mock } from "vitest";

type EntityMapperMock = {
  save: Mock;
  saveAll: Mock;
  receiveUpdates: Mock;
  loadType: Mock;
};

type SnackBarRefMock = Pick<
  MatSnackBarRef<TextOnlySnackBar>,
  "onAction" | "afterDismissed"
> & {
  onAction: Mock<() => Observable<void>>;
  afterDismissed: Mock;
};

type MatSnackBarMock = {
  open: Mock;
};

type ConfirmationDialogMock = {
  getConfirmation: Mock;
  showProgressDialog: Mock;
};

type EntityDeleteServiceMock = {
  deleteEntity: Mock;
};

type EntityAnonymizeServiceMock = {
  anonymizeEntity: Mock;
};

type BulkOperationStateServiceMock = {
  startBulkOperation: Mock;
  completeBulkOperation: Mock;
  waitForBulkOperationToFinish: Mock;
};

describe("EntityActionsService", () => {
  let service: EntityActionsService;
  let mockedEntityMapper: EntityMapperMock;
  let snackBarSpy: MatSnackBarMock;
  let mockSnackBarRef: SnackBarRefMock;
  let mockConfirmationDialog: ConfirmationDialogMock;
  let mockRouter: Router;
  let navigateSpy: ReturnType<typeof vi.spyOn>;
  let mockedEntityDeleteService: EntityDeleteServiceMock;
  let mockedEntityAnonymizeService: EntityAnonymizeServiceMock;
  let mockedBulkOperationState: BulkOperationStateServiceMock;

  let singleTestEntity: Entity;
  let severalTestEntities: Entity[] = [];

  beforeEach(() => {
    singleTestEntity = new Entity();
    severalTestEntities[0] = new Entity();
    severalTestEntities[1] = new Entity();
    severalTestEntities[2] = new Entity();

    mockedEntityDeleteService = {
      deleteEntity: vi.fn(),
    };
    mockedEntityDeleteService.deleteEntity.mockResolvedValue(
      new CascadingActionResult([singleTestEntity]),
    );
    mockedEntityAnonymizeService = {
      anonymizeEntity: vi.fn(),
    };
    mockedEntityAnonymizeService.anonymizeEntity.mockResolvedValue(
      new CascadingActionResult([singleTestEntity]),
    );
    mockedBulkOperationState = {
      startBulkOperation: vi.fn(),
      completeBulkOperation: vi.fn(),
      waitForBulkOperationToFinish: vi.fn(),
    };
    mockedBulkOperationState.waitForBulkOperationToFinish.mockResolvedValue(
      undefined,
    );
    mockedEntityMapper = {
      save: vi.fn(),
      saveAll: vi.fn(),
      receiveUpdates: vi.fn(),
      loadType: vi.fn(),
    };
    mockedEntityMapper.receiveUpdates.mockReturnValue(of());

    snackBarSpy = {
      open: vi.fn(),
    };
    mockSnackBarRef = {
      onAction: vi.fn(),
      afterDismissed: vi.fn(),
    };
    mockSnackBarRef.onAction.mockReturnValue(of());
    snackBarSpy.open.mockReturnValue(mockSnackBarRef);

    mockConfirmationDialog = {
      getConfirmation: vi.fn(),
      showProgressDialog: vi.fn(),
    };
    mockConfirmationDialog.getConfirmation.mockResolvedValue(true);
    mockConfirmationDialog.showProgressDialog.mockReturnValue({
      close: vi.fn(),
    });

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
        {
          provide: PublicFormsService,
          useValue: {
            initCustomFormActions: vi.fn(),
          },
        },
        {
          provide: BulkOperationStateService,
          useValue: mockedBulkOperationState,
        },
      ],
    });
    mockRouter = TestBed.inject(Router);
    navigateSpy = vi.spyOn(mockRouter, "navigate").mockResolvedValue(true);

    service = TestBed.inject(EntityActionsService);
  });

  it("should return false when user cancels confirmation", async () => {
    mockConfirmationDialog.getConfirmation.mockResolvedValue(false);

    const result = await service.delete(new Entity());

    expect(result).toBe(false);
    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(mockedEntityDeleteService.deleteEntity).not.toHaveBeenCalled();
  });

  it("should delete a single entity, show snackbar confirmation and navigate back", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.mockReturnValueOnce(NEVER);
    mockSnackBarRef.afterDismissed.mockReturnValue(of(undefined));

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
    mockSnackBarRef.onAction.mockReturnValueOnce(NEVER);
    mockSnackBarRef.afterDismissed.mockReturnValue(of(undefined));

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

  it("should undo the deletion of several entities", async () => {
    vi.useFakeTimers();
    try {
      const otherAffectedEntities = [new Entity(), new Entity()];
      mockedEntityDeleteService.deleteEntity.mockResolvedValue(
        new CascadingActionResult([
          ...severalTestEntities,
          ...otherAffectedEntities,
        ]),
      );

      // Mock a snackbar where 'undo' is pressed
      const onSnackbarAction = new Subject<void>();
      mockSnackBarRef.onAction.mockReturnValue(onSnackbarAction.asObservable());

      mockedEntityMapper.save.mockResolvedValue(undefined);

      service.delete(severalTestEntities, true);
      await vi.advanceTimersByTimeAsync(0);

      navigateSpy.mockClear();
      onSnackbarAction.next();
      onSnackbarAction.complete();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalled();
      expect(mockedEntityMapper.saveAll).toHaveBeenCalledWith(
        [...severalTestEntities, ...otherAffectedEntities],
        true,
      );
      expect(mockRouter.navigate).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should re-save all affected entities and navigate back to entity on undo", async () => {
    vi.useFakeTimers();
    try {
      const anotherAffectedEntity = new Entity();
      mockedEntityDeleteService.deleteEntity.mockResolvedValue(
        new CascadingActionResult([singleTestEntity, anotherAffectedEntity]),
      );

      // Mock a snackbar where 'undo' is pressed
      const onSnackbarAction = new Subject<void>();
      mockSnackBarRef.onAction.mockReturnValue(onSnackbarAction.asObservable());

      mockedEntityMapper.save.mockResolvedValue(undefined);

      service.delete(singleTestEntity, true);
      await vi.advanceTimersByTimeAsync(0);

      navigateSpy.mockClear();
      onSnackbarAction.next();
      onSnackbarAction.complete();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockedEntityDeleteService.deleteEntity).toHaveBeenCalled();
      expect(mockedEntityMapper.saveAll).toHaveBeenCalledWith(
        [singleTestEntity, anotherAffectedEntity],
        true,
      );
      expect(mockRouter.navigate).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should anonymize and save a single entity", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.mockReturnValueOnce(NEVER);
    mockSnackBarRef.afterDismissed.mockReturnValue(of(undefined));

    const result = await service.anonymize(singleTestEntity);

    expect(result).toBe(true);
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalledWith(
      singleTestEntity,
    );
  });

  it("should anonymize and save several entities and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.mockReturnValueOnce(NEVER);
    mockSnackBarRef.afterDismissed.mockReturnValue(of(undefined));

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

  it("should undo the anonymization of several entities", async () => {
    vi.useFakeTimers();
    try {
      const otherAffectedEntities = [new Entity(), new Entity()];
      mockedEntityAnonymizeService.anonymizeEntity.mockResolvedValue(
        new CascadingActionResult([
          ...severalTestEntities,
          ...otherAffectedEntities,
        ]),
      );

      // Mock a snackbar where 'undo' is pressed
      const onSnackbarAction = new Subject<void>();
      mockSnackBarRef.onAction.mockReturnValue(onSnackbarAction.asObservable());

      mockedEntityMapper.save.mockResolvedValue(undefined);

      service.anonymize(severalTestEntities);
      await vi.advanceTimersByTimeAsync(0);

      onSnackbarAction.next();
      onSnackbarAction.complete();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockedEntityAnonymizeService.anonymizeEntity).toHaveBeenCalled();
      expect(mockedEntityMapper.saveAll).toHaveBeenCalledWith(
        [...severalTestEntities, ...otherAffectedEntities],
        true,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should archive and save a single entity and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.mockReturnValueOnce(NEVER);
    mockSnackBarRef.afterDismissed.mockReturnValue(of(undefined));

    let expectedSavedEntity = singleTestEntity.copy();
    expectedSavedEntity.inactive = true;

    const result = await service.archive(singleTestEntity);
    expect(result).toBe(true);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(expectedSavedEntity);
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it("should archive and save several entities and show snackbar confirmation", async () => {
    // onAction is never called
    mockSnackBarRef.onAction.mockReturnValueOnce(NEVER);
    mockSnackBarRef.afterDismissed.mockReturnValue(of(undefined));

    let expectedSavedEntities = severalTestEntities.map((e) => e.copy());
    expectedSavedEntities.forEach((e) => (e.inactive = true));

    const result = await service.archive(severalTestEntities);
    expect(result).toBe(true);
    expect(mockedEntityMapper.saveAll).toHaveBeenCalledTimes(1);
    expect(mockedEntityMapper.saveAll).toHaveBeenCalledWith(
      expectedSavedEntities,
    );
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it("should archiveUndo and save a single entity", async () => {
    let expectedSavedEntity = singleTestEntity.copy();
    expectedSavedEntity.inactive = true;

    await service.archive(singleTestEntity);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(expectedSavedEntity);
    mockedEntityMapper.save.mockClear();

    await service.undoArchive(singleTestEntity);
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(singleTestEntity);
  });

  it("should archiveUndo and save several entities", async () => {
    let expectedSavedEntities = severalTestEntities.map((e) => e.copy());
    expectedSavedEntities.forEach((e) => (e.inactive = true));

    await service.archive(severalTestEntities);
    expect(mockedEntityMapper.saveAll).toHaveBeenCalledTimes(1);
    expect(mockedEntityMapper.saveAll).toHaveBeenCalledWith(
      expectedSavedEntities,
    );
    mockedEntityMapper.saveAll.mockClear();

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
