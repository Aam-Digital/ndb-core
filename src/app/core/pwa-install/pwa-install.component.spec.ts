import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { PwaInstallComponent } from "./pwa-install.component";
import { PwaInstallService } from "./pwa-install.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import type { Mock } from "vitest";

type PwaInstallServiceMock = Pick<
  PwaInstallService,
  "showIOSInstallInstructions" | "installPWA" | "canInstallDirectly"
> & {
  showIOSInstallInstructions: Mock;
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
    mockPWAInstallService = {
      showIOSInstallInstructions: vi.fn(),
      installPWA: vi.fn(),
      canInstallDirectly: undefined,
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

  function createComponent() {
    fixture = TestBed.createComponent(PwaInstallComponent);
    component = fixture.componentInstance;
  }

  it("should show the pwa install instructions on iOS devices", () => {
    mockPWAInstallService.showIOSInstallInstructions.mockReturnValue(true);
    createComponent();

    fixture.detectChanges();
    expect(component._showPWAInstallButton).toBe(true);

    component.pwaInstallButtonClicked();
    expect(mockSnackbar.openFromTemplate).toHaveBeenCalled();
  });

  it("should call installPWA when no install instructions are defined and remove button once confirmed", async () => {
    createComponent();
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
