import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CoreModule } from "./core.module";
import { EntityActionsMenuService } from "./entity-details/entity-actions-menu/entity-actions-menu.service";
import { EntityMapperService } from "./entity/entity-mapper/entity-mapper.service";
import { EntityDeleteService } from "./entity/entity-actions/entity-delete.service";
import { EntityAnonymizeService } from "./entity/entity-actions/entity-anonymize.service";
import { ConfirmationDialogService } from "./common-components/confirmation-dialog/confirmation-dialog.service";
import { BulkOperationStateService } from "./entity/entity-actions/bulk-operation-state.service";
import { PublicFormsService } from "app/features/public-form/public-forms.service";
import { DuplicateRecordService } from "app/core/entity-list/duplicate-records/duplicate-records.service";
import { TestEntity } from "../utils/test-utils/TestEntity";
import { EntityAbility } from "./permissions/ability/entity-ability";
import { ComponentRegistry } from "../dynamic-components";

describe("CoreModule", () => {
  beforeEach(() => {
    const ability: any = { can: vi.fn().mockReturnValue(true) };

    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [
        { provide: EntityAbility, useValue: ability },
        { provide: ComponentRegistry, useValue: new ComponentRegistry() },
        {
          provide: EntityMapperService,
          useValue: { receiveUpdates: vi.fn().mockReturnValue(of()) },
        },
        { provide: EntityDeleteService, useValue: {} },
        { provide: EntityAnonymizeService, useValue: {} },
        { provide: ConfirmationDialogService, useValue: {} },
        { provide: MatSnackBar, useValue: {} },
        { provide: Router, useValue: {} },
        {
          provide: PublicFormsService,
          useValue: { initCustomFormActions: vi.fn() },
        },
        { provide: BulkOperationStateService, useValue: {} },
        { provide: DuplicateRecordService, useValue: {} },
      ],
    });
  });

  it("registers the default entity actions (archive, anonymize, delete, duplicate) on startup (#4345)", async () => {
    // Simply importing CoreModule (as AppModule does on every app startup) must be
    // enough to register these actions - they must not depend on some other,
    // unrelated component happening to inject EntityActionsService first.
    TestBed.inject(CoreModule);

    const menu = TestBed.inject(EntityActionsMenuService);
    const entities = [TestEntity.create("A"), TestEntity.create("B")];

    const bulkActions = await menu.getActionsForBulk(entities);
    expect(bulkActions.map((action) => action.action)).toEqual(
      expect.arrayContaining(["archive", "delete", "duplicate"]),
    );

    const singleActions = await menu.getActionsForSingle(entities[0]);
    expect(singleActions.map((action) => action.action)).toEqual(
      expect.arrayContaining(["archive", "delete", "duplicate"]),
    );
  });
});
