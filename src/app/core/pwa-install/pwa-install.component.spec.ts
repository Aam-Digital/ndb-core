import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { PwaInstallComponent } from "./pwa-install.component";
import { PwaInstallService, PWAInstallType } from "./pwa-install.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import type { Mock } from "vitest";

type PwaInstallServiceMock = Pick<
  PwaInstallService,
  "getPWAInstallType" | "installPWA"
> & {
  getPWAInstallType: Mock;
  installPWA: Mock;
};

type SnackBarMock = Pick<MatSnackBar, "openFromTemplate"> & {
  openFromTemplate: Mock;
};

describe("PwaInstallComponent", () => {
  let fixture: ComponentFixture<PwaInstallComponent>;
  let component: PwaInstallComponent;
  let mockPWAInstallService: PwaInstallServiceMock;
  let mockSnackbar: SnackBarMock;

  beforeEach(waitForAsync(() => {
    PwaInstallService.canInstallDirectly = undefined;
    mockPWAInstallService = {
      getPWAInstallType: vi.fn(),
      installPWA: vi.fn(),
    };
    mockSnackbar = {
      openFromTemplate: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [PwaInstallComponent, MockedTestingModule],
      providers: [
        { provide: PwaInstallService, useValue: mockPWAInstallService },
        { provide: MatSnackBar, useValue: mockSnackbar },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PwaInstallComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the pwa install instructions on iOS devices", () => {
    mockPWAInstallService.getPWAInstallType.mockReturnValue(
      PWAInstallType.ShowiOSInstallInstructions,
    );

    fixture.detectChanges();
    expect(component._showPWAInstallButton).toBe(true);

    component.pwaInstallButtonClicked();
    expect(mockSnackbar.openFromTemplate).toHaveBeenCalled();
  });

  it("should call installPWA when no install instructions are defined and remove button once confirmed", async () => {
    vi.useFakeTimers();
    try {
      fixture.detectChanges();
      component.showPWAInstallButton = true;

      mockPWAInstallService.installPWA.mockResolvedValue({
        outcome: "accepted",
      });
      component.pwaInstallButtonClicked();
      expect(mockPWAInstallService.installPWA).toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(0);
      expect(component._showPWAInstallButton).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
