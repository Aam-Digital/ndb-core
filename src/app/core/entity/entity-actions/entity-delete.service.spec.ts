import { TestBed } from "@angular/core/testing";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityDeleteService } from "./entity-delete.service";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../entity-mapper/mock-entity-mapper-service";
import {
  allEntities,
  ENTITIES,
  EntityWithAnonRelations,
  expectAllUnchangedExcept,
  expectDeleted,
  expectUpdated,
} from "./cascading-entity-action.spec";
import { expectEntitiesToMatch } from "../../../utils/expect-entity-data.spec";
import { Note } from "../../../child-dev-project/notes/model/note";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { BehaviorSubject, of, throwError } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { UserAdminService } from "../../user/user-admin-service/user-admin.service";
import { SessionInfo, SessionSubject } from "../../session/auth/session-info";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { AttendanceDatatype } from "#src/app/features/attendance/model/attendance.datatype";
import { AttendanceItem } from "#src/app/features/attendance/model/attendance-item";
import { EventAttendanceMapDatatype } from "#src/app/features/attendance/deprecated/event-attendance-map.datatype";
import type { Mock } from "vitest";

describe("EntityDeleteService", () => {
  let service: EntityDeleteService;
  let entityMapper: MockEntityMapperService;

  let snackBarSpy: { open: Mock };
  let mockConfirmationDialog: {
    getConfirmation: Mock;
    showProgressDialog: Mock;
  };
  let mockUserAdminService: { deleteUser: Mock; getUser: Mock };
  let mockSessionSubject: BehaviorSubject<SessionInfo>;

  beforeEach(() => {
    snackBarSpy = {
      open: vi.fn(),
    };
    mockSessionSubject = new BehaviorSubject<SessionInfo>({
      id: "session-user-id",
      name: "test-user",
      roles: [],
    });

    mockUserAdminService = {
      deleteUser: vi.fn(),
      getUser: vi.fn(),
    };
    mockUserAdminService.deleteUser.mockReturnValue(
      throwError(() => {
        new Error();
      }),
    );
    mockUserAdminService.getUser.mockReturnValue(of(null));

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
        EntityDeleteService,
        ...mockEntityMapperProvider(allEntities.map((e) => e.copy())),
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: SessionSubject, useValue: mockSessionSubject },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: DefaultDatatype, useClass: AttendanceDatatype, multi: true },
        {
          provide: DefaultDatatype,
          useClass: EventAttendanceMapDatatype,
          multi: true,
        },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    });

    service = TestBed.inject(EntityDeleteService);

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  function removeReference(
    entity: EntityWithAnonRelations,
    property: "refAggregate" | "refComposite",
    referencedEntity: EntityWithAnonRelations,
  ) {
    const result = entity.copy();
    result[property] = result[property].filter(
      (id) => id !== referencedEntity.getId(),
    );
    return result;
  }

  it("should not cascade delete the related entity if the entity holding the reference is deleted", async () => {
    // for direct references (e.g. x.referencesToRetainAnonymized --> recursively calls anonymize on referenced entities)
    //    see EntityDatatype & EntityArrayDatatype for unit tests

    await service.deleteEntity(ENTITIES.ReferencingSingleComposite);

    expectDeleted([ENTITIES.ReferencingSingleComposite], entityMapper);
    expectAllUnchangedExcept(
      [ENTITIES.ReferencingSingleComposite],
      entityMapper,
    );
  });

  it("should cascade delete the 'composite'-type entity that references the entity user acts on", async () => {
    await service.deleteEntity(ENTITIES.ReferencedAsComposite);

    expectDeleted(
      [ENTITIES.ReferencedAsComposite, ENTITIES.ReferencingSingleComposite],
      entityMapper,
    );
    expectAllUnchangedExcept(
      [ENTITIES.ReferencedAsComposite, ENTITIES.ReferencingSingleComposite],
      entityMapper,
    );
  });

  it("should show error dialog if user account deletion fails after confirmation", async () => {
    // given: account_manager with linked account confirms deletion, but Keycloak returns error
    mockSessionSubject.next({
      id: "session-id",
      name: "test",
      roles: [UserAdminService.ACCOUNT_MANAGER_ROLE],
    });
    mockUserAdminService.getUser.mockReturnValue(of({ id: "kc-user-id" }));
    mockUserAdminService.deleteUser.mockReturnValue(
      throwError(() => new Error()),
    );
    mockConfirmationDialog.getConfirmation.mockResolvedValue(true);
    const userEntity = new TestEntity();
    TestEntity.enableUserAccounts = true;

    // when
    await service.deleteEntity(userEntity);

    // then: confirmation dialog + error dialog = 2 calls
    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalledTimes(2);

    TestEntity.enableUserAccounts = false;
  });

  it("should skip account deletion silently if current user lacks account_manager role", async () => {
    const userEntity = new TestEntity();
    TestEntity.enableUserAccounts = true;
    mockSessionSubject.next({ id: "session-id", name: "test", roles: [] });
    mockUserAdminService.getUser.mockReturnValue(of({ id: "kc-user-id" }));

    await service.deleteEntity(userEntity);

    expect(mockUserAdminService.deleteUser).not.toHaveBeenCalled();
    expect(mockConfirmationDialog.getConfirmation).not.toHaveBeenCalled();
    TestEntity.enableUserAccounts = false;
  });

  it("should ask confirmation and delete account when user has account_manager role and confirms", async () => {
    const userEntity = new TestEntity();
    TestEntity.enableUserAccounts = true;
    mockSessionSubject.next({
      id: "session-id",
      name: "test",
      roles: [UserAdminService.ACCOUNT_MANAGER_ROLE],
    });
    mockUserAdminService.getUser.mockReturnValue(of({ id: "kc-user-id" }));
    mockUserAdminService.deleteUser.mockReturnValue(of({ userDeleted: true }));
    mockConfirmationDialog.getConfirmation.mockResolvedValue(true);

    await service.deleteEntity(userEntity);

    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalledTimes(1);
    expect(mockUserAdminService.deleteUser).toHaveBeenCalled();
    TestEntity.enableUserAccounts = false;
  });

  it("should not delete account if user declines account deletion confirmation", async () => {
    const userEntity = new TestEntity();
    TestEntity.enableUserAccounts = true;
    mockSessionSubject.next({
      id: "session-id",
      name: "test",
      roles: [UserAdminService.ACCOUNT_MANAGER_ROLE],
    });
    mockUserAdminService.getUser.mockReturnValue(of({ id: "kc-user-id" }));
    mockConfirmationDialog.getConfirmation.mockResolvedValue(false);

    await service.deleteEntity(userEntity);

    expect(mockUserAdminService.deleteUser).not.toHaveBeenCalled();
    TestEntity.enableUserAccounts = false;
  });

  it("should skip account deletion silently if no linked account exists", async () => {
    const userEntity = new TestEntity();
    TestEntity.enableUserAccounts = true;
    mockSessionSubject.next({
      id: "session-id",
      name: "test",
      roles: [UserAdminService.ACCOUNT_MANAGER_ROLE],
    });
    mockUserAdminService.getUser.mockReturnValue(of(null));

    await service.deleteEntity(userEntity);

    expect(mockUserAdminService.deleteUser).not.toHaveBeenCalled();
    expect(mockConfirmationDialog.getConfirmation).not.toHaveBeenCalled();
    TestEntity.enableUserAccounts = false;
  });

  it("should not delete own account and show self-deletion warning (full entity ID)", async () => {
    const userEntity = new TestEntity();
    TestEntity.enableUserAccounts = true;
    mockSessionSubject.next({
      id: "session-id",
      name: "test",
      roles: [UserAdminService.ACCOUNT_MANAGER_ROLE],
      entityId: userEntity.getId(),
    });
    mockUserAdminService.getUser.mockReturnValue(of({ id: "kc-user-id" }));

    await service.deleteEntity(userEntity);

    expect(mockUserAdminService.deleteUser).not.toHaveBeenCalled();
    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("own account"),
      OkButton,
    );
    TestEntity.enableUserAccounts = false;
  });

  it("should not delete own account and show self-deletion warning (short entity ID without type prefix)", async () => {
    const userEntity = new TestEntity();
    TestEntity.enableUserAccounts = true;
    mockSessionSubject.next({
      id: "session-id",
      name: "test",
      roles: [UserAdminService.ACCOUNT_MANAGER_ROLE],
      entityId: userEntity.getId(true),
    });
    mockUserAdminService.getUser.mockReturnValue(of({ id: "kc-user-id" }));

    await service.deleteEntity(userEntity);

    expect(mockUserAdminService.deleteUser).not.toHaveBeenCalled();
    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("own account"),
      OkButton,
    );
    TestEntity.enableUserAccounts = false;
  });

  it("should not cascade delete the 'composite'-type entity that still references additional other entities but remove id", async () => {
    const result = await service.deleteEntity(
      ENTITIES.ReferencedAsOneOfMultipleComposites1,
    );

    const expectedUpdatedRelEntity = removeReference(
      ENTITIES.ReferencingTwoComposites,
      "refComposite",
      ENTITIES.ReferencedAsOneOfMultipleComposites1,
    );
    expectDeleted(
      [ENTITIES.ReferencedAsOneOfMultipleComposites1],
      entityMapper,
    );
    expectUpdated([expectedUpdatedRelEntity], entityMapper);
    expectAllUnchangedExcept(
      [
        ENTITIES.ReferencedAsOneOfMultipleComposites1,
        ENTITIES.ReferencingTwoComposites,
      ],
      entityMapper,
    );
    // warn user that there may be personal details in referencing entity which have not been deleted
    expectEntitiesToMatch(result.potentiallyRetainingPII, [
      expectedUpdatedRelEntity,
    ]);
  });

  it("should cascade delete the 'composite'-type entity that references the entity user acts on even when another property holds other id (e.g. ChildSchoolRelation)", async () => {
    await service.deleteEntity(
      ENTITIES.ReferencingCompositeAndAggregate_refComposite,
    );

    expectDeleted(
      [
        ENTITIES.ReferencingCompositeAndAggregate_refComposite,
        ENTITIES.ReferencingCompositeAndAggregate,
      ],
      entityMapper,
    );
    expectAllUnchangedExcept(
      [
        ENTITIES.ReferencingCompositeAndAggregate_refComposite,
        ENTITIES.ReferencingCompositeAndAggregate,
      ],
      entityMapper,
    );
  });

  it("should not cascade delete the 'aggregate'-type entity that only references the entity user acts on but remove id", async () => {
    const result = await service.deleteEntity(
      ENTITIES.ReferencingAggregate_ref,
    );

    const expectedUpdatedRelEntity = removeReference(
      ENTITIES.ReferencingAggregate,
      "refAggregate",
      ENTITIES.ReferencingAggregate_ref,
    );
    expectDeleted([ENTITIES.ReferencingAggregate_ref], entityMapper);
    expectUpdated([expectedUpdatedRelEntity], entityMapper);
    expectAllUnchangedExcept(
      [ENTITIES.ReferencingAggregate_ref, ENTITIES.ReferencingAggregate],
      entityMapper,
    );
    // warn user that there may be personal details in referencing entity which have not been deleted
    expectEntitiesToMatch(result.potentiallyRetainingPII, [
      expectedUpdatedRelEntity,
    ]);
  });

  it("should not cascade delete the 'aggregate'-type entity that still references additional other entities but remove id", async () => {
    await service.deleteEntity(ENTITIES.ReferencingTwoAggregates_ref1);

    expectDeleted([ENTITIES.ReferencingTwoAggregates_ref1], entityMapper);
    expectUpdated(
      [
        removeReference(
          ENTITIES.ReferencingTwoAggregates,
          "refAggregate",
          ENTITIES.ReferencingTwoAggregates_ref1,
        ),
      ],
      entityMapper,
    );
    expectAllUnchangedExcept(
      [
        ENTITIES.ReferencingTwoAggregates_ref1,
        ENTITIES.ReferencingTwoAggregates,
      ],
      entityMapper,
    );
  });

  it("should remove multiple ref ids from related note", async () => {
    const schemaField = Note.schema.get("relatedEntities");
    const originalSchemaAdditional = schemaField.additional;
    schemaField.additional = [TestEntity.ENTITY_TYPE];
    const schemaField2 = Note.schema.get("children");
    const originalSchema2Additional = schemaField2.additional;
    schemaField2.additional = TestEntity.ENTITY_TYPE;

    const primary = new TestEntity();
    const note = new Note();
    note.subject = "test";
    note.children = [primary.getId(), TestEntity.ENTITY_TYPE + ":some-other"];
    note.relatedEntities = [primary.getId()];
    const originalNote = note.copy();
    await entityMapper.save(primary);
    await entityMapper.save(note);

    const result = await service.deleteEntity(primary);

    const actualNote = entityMapper.get(Note.ENTITY_TYPE, note.getId()) as Note;

    expect(actualNote.relatedEntities).toEqual([]);
    expect(actualNote.children).toEqual([
      TestEntity.ENTITY_TYPE + ":some-other",
    ]);

    expect(result.originalEntitiesBeforeChange.length).toBe(2);
    expectEntitiesToMatch(result.originalEntitiesBeforeChange, [
      primary,
      originalNote,
    ]);

    // restore original schema
    schemaField.additional = originalSchemaAdditional;
    schemaField2.additional = originalSchema2Additional;
  });

  it("should remove deleted IDs from 'attendance' field", async () => {
    Note.schema.set("testAttendance", {
      dataType: "attendance",
      additional: {
        participant: {
          dataType: "entity",
          additional: [TestEntity.ENTITY_TYPE],
        },
      },
    });

    const primary = new TestEntity();
    const other = new TestEntity();
    const note = new Note();
    note.subject = "test";
    note["testAttendance"] = [
      new AttendanceItem(undefined, "", primary.getId()),
      new AttendanceItem(undefined, "", other.getId()),
    ];
    const originalNote = note.copy();
    await entityMapper.save(primary);
    await entityMapper.save(other);
    await entityMapper.save(note);

    const result = await service.deleteEntity(primary);

    const actualNote = entityMapper.get(Note.ENTITY_TYPE, note.getId()) as Note;
    expect(actualNote["testAttendance"].length).toBe(1);
    expect(actualNote["testAttendance"][0].participant).toBe(other.getId());

    expect(result.originalEntitiesBeforeChange.length).toBe(2);
    expectEntitiesToMatch(result.originalEntitiesBeforeChange, [
      primary,
      originalNote,
    ]);

    // restore original schema
    Note.schema.delete("testAttendance");
  });
});
