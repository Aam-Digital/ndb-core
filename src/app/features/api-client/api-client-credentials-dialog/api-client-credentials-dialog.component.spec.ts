import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Clipboard } from "@angular/cdk/clipboard";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatButtonHarness } from "@angular/material/button/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import type { Mock } from "vitest";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { ApiClientCredentialsDialogComponent } from "./api-client-credentials-dialog.component";
import { ApiClientService } from "../api-client.service";

describe("ApiClientCredentialsDialogComponent", () => {
  let fixture: ComponentFixture<ApiClientCredentialsDialogComponent>;
  let loader: HarnessLoader;
  let copy: Mock;

  beforeEach(async () => {
    copy = vi.fn().mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [ApiClientCredentialsDialogComponent, FontAwesomeTestingModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            credentials: { clientId: "api-x", clientSecret: "s3cret" },
            scopes: ["reporting_read"],
          },
        },
        {
          provide: ApiClientService,
          useValue: {
            getConnectionDetails: () => ({
              apiBaseUrl: "https://aam.example/api",
              tokenUrl: "https://keycloak.example/token",
            }),
            formatForSharing: () => "all the details",
          },
        },
        { provide: AlertService, useValue: { addInfo: vi.fn() } },
        { provide: Clipboard, useValue: { copy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApiClientCredentialsDialogComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it("shows the secret together with where to use it", () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain("s3cret");
    expect(text).toContain("api-x");
    expect(text).toContain("https://keycloak.example/token");
    expect(text).toContain("https://aam.example/api");
  });

  it("copies everything the external system needs at once", async () => {
    await (
      await loader.getHarness(MatButtonHarness.with({ text: /Copy all/ }))
    ).click();

    expect(copy).toHaveBeenCalledWith("all the details");
  });
});
