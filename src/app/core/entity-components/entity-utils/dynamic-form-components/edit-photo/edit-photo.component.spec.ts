import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditPhotoComponent } from "./edit-photo.component";
import { EntityDetailsModule } from "../../../entity-details/entity-details.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormControl, FormGroup } from "@angular/forms";
import { SessionService } from "../../../../session/session-service/session.service";
import { User } from "../../../../user/user";

describe("EditPhotoComponent", () => {
  let component: EditPhotoComponent;
  let fixture: ComponentFixture<EditPhotoComponent>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(async () => {
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue(new User());
    await TestBed.configureTestingModule({
      imports: [EntityDetailsModule, NoopAnimationsModule],
      declarations: [EditPhotoComponent],
      providers: [{ provide: SessionService, useValue: mockSessionService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPhotoComponent);
    component = fixture.componentInstance;
    const formControl = new FormControl();
    const formGroup = new FormGroup({});
    component.formControlName = "testControl";
    component.formControl = formControl;
    formGroup.registerControl(component.formControlName, formControl);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should correctly update the photo path", () => {
    component.changeFilename("new_file.name");

    expect(component.formControl.value.path).toBe("new_file.name");
  });
});
