import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { MatDialogRef } from "@angular/material/dialog";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatButtonHarness } from "@angular/material/button/testing";
import { MatInputHarness } from "@angular/material/input/testing";
import { MatSelectionListHarness } from "@angular/material/list/testing";
import type { Mock } from "vitest";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { CreateApiClientDialogComponent } from "./create-api-client-dialog.component";
import { ApiClientScope, ApiClientService } from "../api-client.service";

describe("CreateApiClientDialogComponent", () => {
  let fixture: ComponentFixture<CreateApiClientDialogComponent>;
  let loader: HarnessLoader;
  let apiClientService: { getScopes: Mock; createApiClient: Mock };
  let dialogRef: { close: Mock };

  async function openDialog(scopes: ApiClientScope[]) {
    apiClientService = {
      getScopes: vi.fn().mockResolvedValue(scopes),
      createApiClient: vi
        .fn()
        .mockResolvedValue({ clientId: "api-x", clientSecret: "secret" }),
    };
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [CreateApiClientDialogComponent, FontAwesomeTestingModule],
      providers: [
        { provide: ApiClientService, useValue: apiClientService },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateApiClientDialogComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  }

  async function fillAndSubmit(name: string, accessTitle: RegExp) {
    await (await loader.getHarness(MatInputHarness)).setValue(name);
    await (
      await loader.getHarness(MatSelectionListHarness)
    ).selectItems({ title: accessTitle });
    await (
      await loader.getHarness(MatButtonHarness.with({ text: "Create" }))
    ).click();
  }

  const reportingScope: ApiClientScope = {
    name: "reporting_read",
    description: "Access to reporting-api GET endpoints",
  };
  const singleSignOnScope: ApiClientScope = {
    name: "third_party_authentication",
    description: "Access to create user sessions",
  };

  it("warns that single sign-on access allows signing in as any user", async () => {
    await openDialog([reportingScope, singleSignOnScope]);
    const list = await loader.getHarness(MatSelectionListHarness);
    const warning = () =>
      fixture.nativeElement.textContent.includes("as any of its users");

    await list.selectItems({ title: /Read reports/ });
    expect(warning()).toBe(false);

    await list.selectItems({ title: /single sign-on/ });
    expect(warning()).toBe(true);
  });

  it("creates the API client with the selected access and passes its credentials on", async () => {
    await openDialog([reportingScope, singleSignOnScope]);

    await fillAndSubmit("  TolaData  ", /Read reports/);

    await vi.waitFor(() =>
      expect(dialogRef.close).toHaveBeenCalledWith({
        credentials: { clientId: "api-x", clientSecret: "secret" },
        scopes: ["reporting_read"],
      }),
    );
    expect(apiClientService.createApiClient).toHaveBeenCalledWith("TolaData", [
      "reporting_read",
    ]);
  });

  it("shows why the backend refused to create the API client", async () => {
    await openDialog([reportingScope]);
    apiClientService.createApiClient.mockRejectedValue(
      new HttpErrorResponse({
        status: 500,
        error: { errorMessage: "Client scope 'reporting_read' does not exist" },
      }),
    );

    await fillAndSubmit("TolaData", /Read reports/);

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
      ).toContain("Client scope 'reporting_read' does not exist");
    });
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
