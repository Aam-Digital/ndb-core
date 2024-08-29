import { TestBed } from "@angular/core/testing";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityDeleteService } from "./entity-delete.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
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
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { EventAttendanceMapDatatype } from "../../../child-dev-project/attendance/model/event-attendance.datatype";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { throwError } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";

describe("EntityDeleteService", () => {
  let service: EntityDeleteService;
  let entityMapper: MockEntityMapperService;

  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;

  beforeEach(() => {
    entityMapper = mockEntityMapper(allEntities.map((e) => e.copy()));

    mockAuthService = jasmine.createSpyObj(["deleteUser"]);
    mockAuthService.deleteUser.and.returnValue(
      throwError(() => {
        new Error();
      }),
    );

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
        EntityDeleteService,
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: KeycloakAuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: snackBarSpy },
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

  it("should delete several entities and show dialog if keycloak deletion fails", async () => {
    // given
    mockAuthService.deleteUser.and.returnValue(throwError(() => new Error()));
    let userEntity = createEntityOfType("User");

    // when
    await service.deleteEntity(userEntity, true);

    // then
    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalledTimes(1);
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
});
