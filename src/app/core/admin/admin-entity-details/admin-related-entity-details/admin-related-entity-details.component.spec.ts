import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  AdminRelatedEntityDetailsComponent,
  AdminRelatedEntityDetailsData,
} from "./admin-related-entity-details.component";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../entity/database-entity.decorator";

import { EntityForm } from "../../../common-components/entity-form/entity-form";
import { EntityFormService } from "../../../common-components/entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { SyncStateSubject } from "../../../session/session-type";
import { CurrentUserSubject } from "../../../session/current-user-subject";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

describe("AdminRelatedEntityDetailsComponent", () => {
  let component: AdminRelatedEntityDetailsComponent;
  let fixture: ComponentFixture<AdminRelatedEntityDetailsComponent>;
  let mockFormService: jasmine.SpyObj<EntityFormService>;
  let mockDialogRef: jasmine.SpyObj<
    MatDialogRef<AdminRelatedEntityDetailsComponent>
  >;
  let mockDialogData: AdminRelatedEntityDetailsData;

  beforeEach(async () => {
    mockFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
    ]);
    mockFormService.createEntityForm.and.returnValue(
      Promise.resolve({
        formGroup: new FormGroup({}),
      } as EntityForm<any>),
    );

    mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);

    mockDialogData = {
      entityConstructor: TestEntity,
      currentColumns: [],
    };

    await TestBed.configureTestingModule({
      imports: [AdminRelatedEntityDetailsComponent, FontAwesomeTestingModule],
      providers: [
        { provide: EntityFormService, useValue: mockFormService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        {
          provide: EntityRegistry,
          useValue: { entityRegistry },
        },
        SyncStateSubject,
        CurrentUserSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRelatedEntityDetailsComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
