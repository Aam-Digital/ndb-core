import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminConfigCleanupComponent } from "./admin-config-cleanup.component";
import {
  ConfigCleanupAnalysis,
  ConfigCleanupService,
  UnusedConfigurableEnum,
} from "./config-cleanup.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfigurableEnum } from "../../basic-datatypes/configurable-enum/configurable-enum";

describe("AdminConfigCleanupComponent", () => {
  let fixture: ComponentFixture<AdminConfigCleanupComponent>;
  let component: AdminConfigCleanupComponent;

  const enumEntity = new ConfigurableEnum("unused");
  const unusedConfigurableEnum: UnusedConfigurableEnum = {
    enumEntity,
    usages: [],
  };

  const analysis: ConfigCleanupAnalysis = {
    totalEnums: 1,
    usedEnums: 0,
    unusedEnums: [unusedConfigurableEnum],
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
      imports: [AdminConfigCleanupComponent],
      providers: [
        { provide: ConfigCleanupService, useValue: configCleanupServiceMock },
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialogMock,
        },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminConfigCleanupComponent);
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
    await component["deleteEnum"](unusedConfigurableEnum);

    expect(confirmationDialogMock.getConfirmation).toHaveBeenCalled();
    expect(
      configCleanupServiceMock.deleteUnusedConfigurableEnum,
    ).toHaveBeenCalledWith(enumEntity);
    expect(snackBarMock.open).toHaveBeenCalled();
  });
});
