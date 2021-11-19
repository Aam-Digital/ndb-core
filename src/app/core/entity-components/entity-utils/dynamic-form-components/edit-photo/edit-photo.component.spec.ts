import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditPhotoComponent } from "./edit-photo.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { SessionService } from "../../../../session/session-service/session.service";
import { setupEditComponent } from "../edit-component.spec";

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
    setupEditComponent(component);
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
