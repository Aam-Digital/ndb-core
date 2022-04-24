import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { PwaInstallComponent } from "./pwa-install.component";
import { PwaInstallModule } from "./pwa-install.module";
import { PwaInstallService, PWAInstallType } from "./pwa-install.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject } from "rxjs";
import { take } from "rxjs/operators";
import { MockedTestingModule } from "../utils/mocked-testing.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("PwaInstallComponent", () => {
  let mockPWAInstallService: jasmine.SpyObj<PwaInstallService>;
  let mockSnackbar: jasmine.SpyObj<MatSnackBar>;
  const pwaInstallResult = new Subject();

  beforeEach(async () => {
    mockPWAInstallService = jasmine.createSpyObj(
      ["getPWAInstallType", "installPWA", "registerPWAInstallListener"],
      { canInstallDirectly: pwaInstallResult.pipe(take(1)).toPromise() }
    );
    mockSnackbar = jasmine.createSpyObj(["openFromTemplate"]);
    await TestBed.configureTestingModule({
      imports: [
        PwaInstallModule,
        MockedTestingModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: PwaInstallService, useValue: mockPWAInstallService },
        { provide: MatSnackBar, useValue: mockSnackbar },
      ],
    }).compileComponents();
  });

  it("should create", () => {
    expect(createComponent()).toBeTruthy();
  });

  it("should show the pwa install instructions on iOS devices", () => {
    mockPWAInstallService.getPWAInstallType.and.returnValue(
      PWAInstallType.ShowiOSInstallInstructions
    );

    const component = createComponent();
    expect(component.showPWAInstallButton).toBeTrue();

    component.pwaInstallButtonClicked();
    expect(mockSnackbar.openFromTemplate).toHaveBeenCalled();
  });

  it("should call installPWA when no install instructions are defined and remove button once confirmed", fakeAsync(() => {
    pwaInstallResult.next();

    const component = createComponent();
    console.log("created");
    tick();
    console.log("checking");
    expect(component.showPWAInstallButton).toBeTrue();

    mockPWAInstallService.installPWA.and.resolveTo({ outcome: "accepted" });
    component.pwaInstallButtonClicked();
    expect(mockPWAInstallService.installPWA).toHaveBeenCalled();

    tick();
    expect(component.showPWAInstallButton).toBeFalse();
  }));

  function createComponent(): PwaInstallComponent {
    const fixture = TestBed.createComponent(PwaInstallComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }
});
