import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminRelatedEntityDetailsComponent } from "./admin-related-entity-details.component";
import {
  DatabaseEntity,
  EntityRegistry,
} from "../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { Entity } from "../../../entity/model/entity";
import { EntityForm } from "../../../common-components/entity-form/entity-form";
import { EntityFormService } from "../../../common-components/entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { SyncStateSubject } from "../../../session/session-type";
import { CurrentUserSubject } from "../../../session/current-user-subject";
import { MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { AdminEntityService } from "../../admin-entity.service";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

describe("AdminRelatedEntityDetailsComponent", () => {
  let component: AdminRelatedEntityDetailsComponent;
  let fixture: ComponentFixture<AdminRelatedEntityDetailsComponent>;
  let mockFormService: jasmine.SpyObj<EntityFormService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AdminRelatedEntityDetailsComponent>>;


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
    fixture = TestBed.createComponent(AdminRelatedEntityDetailsComponent);
    component = fixture.componentInstance;
    component.entityConstructor = TestEntity;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
