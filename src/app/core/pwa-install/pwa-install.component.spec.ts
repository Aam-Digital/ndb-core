import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { PwaInstallComponent } from "./pwa-install.component";
import { PwaInstallService, PWAInstallType } from "./pwa-install.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { firstValueFrom, Subject } from "rxjs";
import { take } from "rxjs/operators";
import { MockedTestingModule } from "../../utils/mocked-testing.module";

describe("PwaInstallComponent", () => {
  let fixture: ComponentFixture<PwaInstallComponent>;
  let component: PwaInstallComponent;
  let mockPWAInstallService: jasmine.SpyObj<PwaInstallService>;
  let mockSnackbar: jasmine.SpyObj<MatSnackBar>;
  const pwaInstallResult = new Subject<any>();

  beforeEach(waitForAsync(() => {
    PwaInstallService.canInstallDirectly = firstValueFrom(
      pwaInstallResult.pipe(take(1)),
    );
    mockPWAInstallService = jasmine.createSpyObj([
      "getPWAInstallType",
      "installPWA",
    ]);
    mockSnackbar = jasmine.createSpyObj(["openFromTemplate"]);
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
    mockPWAInstallService.getPWAInstallType.and.returnValue(
      PWAInstallType.ShowiOSInstallInstructions,
    );

    fixture.detectChanges();
    expect(component._showPWAInstallButton).toBeTrue();

    component.pwaInstallButtonClicked();
    expect(mockSnackbar.openFromTemplate).toHaveBeenCalled();
  });

  it("should call installPWA when no install instructions are defined and remove button once confirmed", fakeAsync(() => {
    pwaInstallResult.next(undefined);

    fixture.detectChanges();
    tick();
    expect(component._showPWAInstallButton).toBeTrue();

    mockPWAInstallService.installPWA.and.resolveTo({ outcome: "accepted" });
    component.pwaInstallButtonClicked();
    expect(mockPWAInstallService.installPWA).toHaveBeenCalled();

    tick();
    expect(component._showPWAInstallButton).toBeFalse();
  }));
});
