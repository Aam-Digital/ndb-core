import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfigurableEnumCleanupComponent } from "./configurable-enum-cleanup.component";
import {
  ConfigCleanupAnalysis,
  ConfigurableEnumCleanupService,
  ConfigurableEnumUsageSummary,
} from "./configurable-enum-cleanup.service";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfigurableEnum } from "../../../basic-datatypes/configurable-enum/configurable-enum";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ConfigurableEnumCleanupComponent", () => {
  let fixture: ComponentFixture<ConfigurableEnumCleanupComponent>;
  let component: ConfigurableEnumCleanupComponent;

  const unusedEnumEntity = new ConfigurableEnum("unused");
  const usedEnumEntity = new ConfigurableEnum("attendance-status");

  const unusedEnumSummary: ConfigurableEnumUsageSummary = {
    enumEntity: unusedEnumEntity,
  };

  const usedEnumSummary: ConfigurableEnumUsageSummary = {
    enumEntity: usedEnumEntity,
  };

  const analysis: ConfigCleanupAnalysis = {
    totalEnums: 2,
    usedEnums: 1,
    usedEnumDetails: [usedEnumSummary],
    unusedEnums: [unusedEnumSummary],
  };

  const configCleanupServiceMock = {
    analyzeUnusedConfigurableEnums: vi.fn(),
    deleteUnusedConfigurableEnum: vi.fn(),
  };

  const confirmationDialogMock = {
    getConfirmation: vi.fn(),
  };

  const snackBarMock = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    configCleanupServiceMock.analyzeUnusedConfigurableEnums.mockResolvedValue(
      analysis,
    );
    configCleanupServiceMock.deleteUnusedConfigurableEnum.mockResolvedValue(
      true,
    );
    confirmationDialogMock.getConfirmation.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [ConfigurableEnumCleanupComponent, FontAwesomeTestingModule],
      providers: [
        {
          provide: ConfigurableEnumCleanupService,
          useValue: configCleanupServiceMock,
        },
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialogMock,
        },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigurableEnumCleanupComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load analysis on initialization", () => {
    expect(
      configCleanupServiceMock.analyzeUnusedConfigurableEnums,
    ).toHaveBeenCalled();
  });

  it("should confirm and delete enum", async () => {
    await component["deleteEnum"](unusedEnumSummary);

    expect(confirmationDialogMock.getConfirmation).toHaveBeenCalled();
    expect(
      configCleanupServiceMock.deleteUnusedConfigurableEnum,
    ).toHaveBeenCalledWith(unusedEnumEntity);
    expect(snackBarMock.open).toHaveBeenCalled();
  });

  it("should show error feedback when enum deletion fails", async () => {
    configCleanupServiceMock.deleteUnusedConfigurableEnum.mockRejectedValueOnce(
      new Error("DB failure"),
    );

    await component["deleteEnum"](unusedEnumSummary);

    expect(snackBarMock.open).toHaveBeenCalledWith(
      "Could not delete enum. Please try again.",
      undefined,
      { duration: 5000 },
    );
  });
});
