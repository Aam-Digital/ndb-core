import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditPhotoComponent } from "./edit-photo.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormControl, FormGroup } from "@angular/forms";
import { SessionService } from "../../../../session/session-service/session.service";
import { TypedFormControl } from "../edit-component";
import { Photo } from "../../../../../child-dev-project/children/child-photo-service/photo";

describe("EditPhotoComponent", () => {
  let component: EditPhotoComponent;
  let fixture: ComponentFixture<EditPhotoComponent>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(async () => {
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [{ provide: SessionService, useValue: mockSessionService }],
      declarations: [EditPhotoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPhotoComponent);
    component = fixture.componentInstance;
    const formControl = new FormControl();
    const formGroup = new FormGroup({});
    component.formControlName = "testControl";
    component.formControl = formControl as TypedFormControl<Photo>;
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

  it("should allow editing photos when the user is admin", () => {
    mockSessionService.getCurrentUser.and.returnValue({
      name: "User",
      roles: ["admin_app"],
    });
    expect(component.editPhotoAllowed).toBeFalse();

    component.ngOnInit();

    expect(component.editPhotoAllowed).toBeTrue();
  });
});
