import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditButtonComponent } from "./edit-button.component";
import { MatButtonModule } from "@angular/material/button";
import { EntityPermissionsService } from "../../permissions/entity-permissions.service";
import { Entity } from "../../entity/entity";

class NotPermittedEntity extends Entity {
  getType(): string {
    return "NotPermittedEntity";
  }
}

class PermittedEntity extends Entity {
  getType(): string {
    return "PermittedEntity";
  }
}

describe("EditButtonComponent", () => {
  let component: EditButtonComponent;
  let fixture: ComponentFixture<EditButtonComponent>;
  const notPermittedEntity = new NotPermittedEntity();
  const permittedEntity = new PermittedEntity();

  beforeEach(async () => {
    const mockPermissionService = jasmine.createSpyObj(["userIsPermitted"]);
    // Mock the scenario where the user has the right to edit PermittedEntity but not NotPermittedEntity
    mockPermissionService.userIsPermitted.and.callFake((entity) => {
      return entity === PermittedEntity;
    });

    await TestBed.configureTestingModule({
      imports: [MatButtonModule],
      declarations: [EditButtonComponent],
      providers: [
        { provide: EntityPermissionsService, useValue: mockPermissionService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit whenever a user clicks on the edit button", (done) => {
    component.editingChange.subscribe(done);
    component.toggleEdit();
  });

  it("should disable the button when the current user does not have the required permission", () => {
    component.managingEntity = notPermittedEntity;
    expect(component.disabled).toBeTrue();
  });

  it("should be enabled when the current user has the required permission", () => {
    component.managingEntity = permittedEntity;
    expect(component.disabled).toBeFalse();
  });

  it("no longer edits when save is clicked", (done) => {
    component.onSave.subscribe(done);
    component.save();
    expect(component.editing).toBeFalse();
  });

  it("no longer edits when cancel is clicked", (done) => {
    component.onCancel.subscribe(done);
    component.cancel();
    expect(component.editing).toBeFalse();
  });
});
