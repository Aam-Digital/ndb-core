import { EventEmitter } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { AdminRelatedEntityDetailsComponent } from "./admin-related-entity-details.component";
import { AdminEntityService } from "#src/app/core/admin/admin-entity.service";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { mockMatDialogRef } from "#src/app/utils/test-utils/dialog-mocks";

@DatabaseEntity("RelatedDetailsCancelTest")
class RelatedDetailsCancelTest extends Entity {}

describe("AdminRelatedEntityDetailsComponent", () => {
  let component: AdminRelatedEntityDetailsComponent;
  let entitySchemaUpdated: EventEmitter<void>;

  beforeEach(() => {
    RelatedDetailsCancelTest.schema.set("role", {
      dataType: "string",
      label: "Role",
    });
    entitySchemaUpdated = new EventEmitter<void>();
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialogRef, useValue: mockMatDialogRef() },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entityConstructor: RelatedDetailsCancelTest,
            currentColumns: ["role"],
          },
        },
        { provide: AdminEntityService, useValue: { entitySchemaUpdated } },
      ],
    });
    component = TestBed.runInInjectionContext(
      () => new AdminRelatedEntityDetailsComponent(),
    );
    component.ngOnInit();
  });

  afterEach(() => {
    RelatedDetailsCancelTest.schema.delete("role");
  });

  it("notifies schema listeners about the restored original schema on cancel", () => {
    RelatedDetailsCancelTest.schema.set("role", {
      dataType: "string",
      label: "Function",
    });
    const labelsSeenByListeners: string[] = [];
    entitySchemaUpdated.subscribe(() =>
      labelsSeenByListeners.push(
        RelatedDetailsCancelTest.schema.get("role").label as string,
      ),
    );

    component.cancelChanges();

    expect(labelsSeenByListeners).toEqual(["Role"]);
  });
});
