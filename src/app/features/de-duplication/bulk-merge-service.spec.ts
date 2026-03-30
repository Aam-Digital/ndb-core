import { TestBed } from "@angular/core/testing";
import { BulkMergeService } from "./bulk-merge-service";
import { CoreTestingModule } from "app/utils/core-testing.module";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { expectEntitiesToBeInDatabase } from "app/utils/expect-entity-data.spec";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { Entity } from "app/core/entity/model/entity";
import { DatabaseField } from "app/core/entity/database-field.decorator";
import { AttendanceItem } from "app/features/attendance/model/attendance-item";
import { Note } from "app/child-dev-project/notes/model/note";
import { createEntityOfType } from "app/core/demo-data/create-entity-of-type";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import { MatDialog } from "@angular/material/dialog";
import { of, throwError } from "rxjs";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import type { Mock } from "vitest";

@DatabaseEntity("TestEntityWithAccounts")
class TestEntityWithAccounts extends Entity {
  static override readonly enableUserAccounts = true;
}

@DatabaseEntity("EntityWithMergedRelations")
class EntityWithMergedRelations extends Entity {
  @DatabaseField({
    dataType: "entity",
    additional: TestEntity.ENTITY_TYPE,
  })
  singleRelated;
  @DatabaseField({
    dataType: "entity",
    additional: ["Child", TestEntity.ENTITY_TYPE],
    isArray: true,
  })
  multiRelated;
}

@DatabaseEntity("EntityWithAttendance")
class EntityWithAttendance extends Entity {
  @DatabaseField({
    dataType: "entity",
    additional: TestEntity.ENTITY_TYPE,
    isArray: true,
  })
  participants: string[] = [];

  @DatabaseField({
    dataType: "attendance",
    isArray: true,
    additional: {
      participant: { dataType: "entity", additional: [TestEntity.ENTITY_TYPE] },
    },
  })
  attendance: AttendanceItem[] = [];
}

describe("BulkMergeService", () => {
  let service: BulkMergeService;

  let entityMapper: MockEntityMapperService;
  let mockUserAdminService: {
    getUser: Mock;
    deleteUser: Mock;
    updateUser: Mock;
  };
  let mockMatDialog: { open: Mock };
  let mockConfirmationDialog: { getConfirmation: Mock };

  let recordA: TestEntity;
  let recordB: TestEntity;

  beforeEach(() => {
    mockUserAdminService = {
      getUser: vi.fn().mockReturnValue(throwError(() => ({ status: 404 }))),
      deleteUser: vi.fn().mockReturnValue(of({ userDeleted: true })),
      updateUser: vi.fn().mockReturnValue(of({ userUpdated: true })),
    };
    mockMatDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }),
    };
    mockConfirmationDialog = {
      getConfirmation: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      imports: [CoreTestingModule, NoopAnimationsModule],
      providers: [
        ...mockEntityMapperProvider(),
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: MatDialog, useValue: mockMatDialog },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    });

    service = TestBed.inject(BulkMergeService);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;

    recordA = TestEntity.create({ name: "A" });
    recordB = TestEntity.create({ name: "B" });
    entityMapper.addAll([recordA, recordB]);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should show an error dialog and return false when executeAction is called with != 2 entities", async () => {
    const result = await service.executeAction([recordA]);
    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it("should return false when merge dialog is closed without confirming", async () => {
    mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) });
    const result = await service.showMergeDialog(
      [recordA, recordB],
      TestEntity,
    );
    expect(result).toBe(false);
  });

  it("should open dialog with no reordering when no accounts exist", async () => {
    await service.showMergeDialog([recordA, recordB], TestEntity);
    const dialogData = mockMatDialog.open.mock.calls[0][1].data;
    expect(dialogData.entitiesToMerge[0].getId()).toBe(recordA.getId());
  });

  it("should update record_A and delete record_B when merge is confirmed", async () => {
    //const mergedEntity = TestEntity.create({ name: "A1" });
    // or more realistically only update one of the existing records:
    const mergedEntity = TestEntity.create({ ...recordA, name: "A1" });

    await service.executeMerge(mergedEntity, [recordA, recordB]);

    await expectEntitiesToBeInDatabase([mergedEntity], false, true);
  });

  it("should update IDs in singleRelated entities of recordB into recordA after merging", async () => {
    const relatedEntity = new EntityWithMergedRelations();
    relatedEntity.singleRelated = recordB.getId();
    await entityMapper.save(relatedEntity);

    const mergedEntity = TestEntity.create({ ...recordA, name: "A1" });

    await service.executeMerge(mergedEntity, [recordA, recordB]);

    const updatedRelatedEntity = entityMapper.get(
      EntityWithMergedRelations.ENTITY_TYPE,
      relatedEntity.getId(),
    ) as EntityWithMergedRelations;

    expect(updatedRelatedEntity.singleRelated).toEqual(recordA.getId());
  });

  it("should update IDs in multiRelated entities of recordB into recordA without duplicating recordA's ID", async () => {
    const relatedEntity = new EntityWithMergedRelations();
    relatedEntity.multiRelated = [recordA.getId(), recordB.getId()];
    await entityMapper.save(relatedEntity);

    const mergedEntity = TestEntity.create({ ...recordA, name: "A1" });

    await service.executeMerge(mergedEntity, [recordA, recordB]);

    const updatedRelatedEntity = entityMapper.get(
      EntityWithMergedRelations.ENTITY_TYPE,
      relatedEntity.getId(),
    ) as EntityWithMergedRelations;

    expect(updatedRelatedEntity.multiRelated).toEqual([recordA.getId()]);
    expect(updatedRelatedEntity.multiRelated).not.toContain(recordB.getId());
  });

  it("should update childrenAttendance when merging Child entities", async () => {
    const child1 = createEntityOfType("Child", "child1");
    const child2 = createEntityOfType("Child", "child2");

    const note1 = new Note("note1");
    note1.children.push(child1.getId());

    const note2 = new Note("note2");
    note2.children.push(child2.getId());

    const attendance = new AttendanceItem();
    attendance.participant = child2.getId();
    note2.childrenAttendance.push(attendance);

    await entityMapper.saveAll([note1, note2]);

    const mergedEntity = TestEntity.create({ ...child1, name: "A1" });
    await service.executeMerge(mergedEntity, [child1, child2]);

    const updatedNote = await entityMapper.load(Note, note2.getId());
    const newAttendance = updatedNote.childrenAttendance.find(
      (item) => item.participant === child1.getId(),
    );
    expect(newAttendance).toBeDefined();
  });

  it("should update participant references in any attendance-type field when merging", async () => {
    const relatedEntity = new EntityWithAttendance();
    relatedEntity.participants = [recordA.getId(), recordB.getId()];
    relatedEntity.attendance = [
      new AttendanceItem(undefined, "", recordA.getId()),
      new AttendanceItem(undefined, "", recordB.getId()),
    ];
    await entityMapper.save(relatedEntity);

    const mergedEntity = TestEntity.create({ ...recordA, name: "A1" });
    await service.executeMerge(mergedEntity, [recordA, recordB]);

    const updated = entityMapper.get(
      EntityWithAttendance.ENTITY_TYPE,
      relatedEntity.getId(),
    ) as EntityWithAttendance;

    expect(updated.participants).toEqual([recordA.getId()]);
    expect(updated.attendance.length).toBe(2);
    expect(
      updated.attendance.every((a) => a.participant === recordA.getId()),
    ).toBe(true);
  });

  describe("user account handling", () => {
    let entityA: TestEntityWithAccounts;
    let entityB: TestEntityWithAccounts;
    const mockUserAccount = { id: "kc-1", email: "b@test.com", enabled: true };

    beforeEach(() => {
      entityA = new TestEntityWithAccounts();
      entityB = new TestEntityWithAccounts();
      entityMapper.addAll([entityA, entityB]);
    });

    it("should delete the user account of the discarded entity on executeMerge", async () => {
      const mergedEntity = Object.assign(new TestEntityWithAccounts(), entityA);
      mergedEntity["_id"] = entityA.getId();

      await service.executeMerge(
        mergedEntity,
        [entityA, entityB],
        [null, mockUserAccount],
      );

      expect(mockUserAdminService.deleteUser).toHaveBeenCalledWith(
        entityB.getId(),
      );
      expect(mockUserAdminService.deleteUser).not.toHaveBeenCalledWith(
        entityA.getId(),
      );
    });

    it("should not call deleteUser when no account is linked to the discarded entity", async () => {
      const mergedEntity = TestEntity.create({ ...recordA, name: "A1" });
      await service.executeMerge(mergedEntity, [recordA, recordB]);

      expect(mockUserAdminService.deleteUser).not.toHaveBeenCalled();
    });

    it("should reorder entities in showMergeDialog so account-holder is primary (index 0)", async () => {
      // Only entityB has an account
      const notFound$ = throwError(() => ({ status: 404 }));
      mockUserAdminService.getUser.mockImplementation((entityId: string) => {
        if (entityId === entityB.getId()) return of(mockUserAccount);
        return notFound$;
      });

      await service.showMergeDialog([entityA, entityB], TestEntityWithAccounts);

      const dialogData = mockMatDialog.open.mock.calls[0][1].data;
      expect(dialogData.entitiesToMerge[0].getId()).toBe(entityB.getId());
    });

    it("should call updateUser with accountUpdate payload after secondary entity is deleted", async () => {
      const mergedEntity = Object.assign(new TestEntityWithAccounts(), entityA);
      mergedEntity["_id"] = entityA.getId();
      const accountUpdate = {
        accountId: "kc-a",
        update: { email: "new@test.com" },
      };

      await service.executeMerge(
        mergedEntity,
        [entityA, entityB],
        [null, null],
        accountUpdate,
      );

      expect(mockUserAdminService.updateUser).toHaveBeenCalledWith("kc-a", {
        email: "new@test.com",
      });
    });

    it("should open dialog with both accounts when both entities have accounts", async () => {
      const mockAccountA = { id: "kc-a", email: "a@test.com", enabled: true };
      mockUserAdminService.getUser.mockImplementation((entityId: string) => {
        if (entityId === entityA.getId()) return of(mockAccountA);
        return of(mockUserAccount);
      });

      await service.showMergeDialog([entityA, entityB], TestEntityWithAccounts);

      expect(mockMatDialog.open).toHaveBeenCalled();
    });
  });
});
