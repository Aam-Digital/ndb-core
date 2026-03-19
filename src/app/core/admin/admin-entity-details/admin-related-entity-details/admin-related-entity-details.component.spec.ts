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
import type { Mock } from "vitest";

type EntityFormServiceMock = {
  createEntityForm: Mock;
};

type DialogRefMock = {
  close: Mock;
};

describe("AdminRelatedEntityDetailsComponent", () => {
  let component: AdminRelatedEntityDetailsComponent;
  let fixture: ComponentFixture<AdminRelatedEntityDetailsComponent>;
  let mockFormService: EntityFormServiceMock;
  let mockDialogRef: DialogRefMock;
  let mockDialogData: AdminRelatedEntityDetailsData;

  beforeEach(async () => {
    mockFormService = {
      createEntityForm: vi.fn().mockName("EntityFormService.createEntityForm"),
    };
    mockFormService.createEntityForm.mockReturnValue(
      Promise.resolve({
        formGroup: new FormGroup({}),
      } as EntityForm<any>),
    );

    mockDialogRef = {
      close: vi.fn().mockName("MatDialogRef.close"),
    };

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
