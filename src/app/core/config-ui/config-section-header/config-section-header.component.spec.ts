import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfigSectionHeaderComponent } from "./config-section-header.component";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ConfigSectionHeaderComponent", () => {
  let component: ConfigSectionHeaderComponent;
  let fixture: ComponentFixture<ConfigSectionHeaderComponent>;

  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(() => {
    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);

    TestBed.configureTestingModule({
      imports: [
        ConfigSectionHeaderComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    });
    fixture = TestBed.createComponent(ConfigSectionHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only emit removeSection if user confirms confirmation dialog", async () => {
    spyOn(component.remove, "emit");

    mockConfirmationDialog.getConfirmation.and.resolveTo(false);
    await component.removeSection();
    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
    expect(component.remove.emit).not.toHaveBeenCalled();

    mockConfirmationDialog.getConfirmation.and.resolveTo(true);
    await component.removeSection();
    expect(component.remove.emit).toHaveBeenCalled();
  });

  it("should not show confirmation dialog if disableConfirmation is set", async () => {
    spyOn(component.remove, "emit");

    component.disableConfirmation = true;
    await component.removeSection();
    expect(mockConfirmationDialog.getConfirmation).not.toHaveBeenCalled();
    expect(component.remove.emit).toHaveBeenCalled();
  });
});
