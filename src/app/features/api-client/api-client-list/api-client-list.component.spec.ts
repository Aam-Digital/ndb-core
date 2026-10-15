import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatButtonHarness } from "@angular/material/button/testing";
import { of } from "rxjs";
import type { Mock } from "vitest";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { ApiClientListComponent } from "./api-client-list.component";
import { ApiClient, ApiClientService } from "../api-client.service";
import { CreateApiClientDialogComponent } from "../create-api-client-dialog/create-api-client-dialog.component";
import { ApiClientCredentialsDialogComponent } from "../api-client-credentials-dialog/api-client-credentials-dialog.component";

describe("ApiClientListComponent", () => {
  let fixture: ComponentFixture<ApiClientListComponent>;
  let loader: HarnessLoader;
  let apiClientService: {
    isAvailable: ReturnType<typeof signal<boolean>>;
    isCheckingAvailability: ReturnType<typeof signal<boolean>>;
    getApiClients: Mock;
    regenerateSecret: Mock;
    deleteApiClient: Mock;
  };
  let getConfirmation: Mock;
  let openDialog: Mock;

  const existingClient: ApiClient = {
    clientId: "api-reporting-dashboard-x7k2pq",
    name: "Reporting dashboard",
    scopes: ["reporting_read"],
    createdBy: "manager@example.org",
    createdAt: "2026-10-01T10:00:00Z",
  };

  async function render(options: {
    available: boolean;
    dialogResult?: unknown;
  }) {
    apiClientService = {
      isAvailable: signal(options.available),
      isCheckingAvailability: signal(false),
      getApiClients: vi.fn().mockResolvedValue([existingClient]),
      regenerateSecret: vi.fn().mockResolvedValue({
        clientId: existingClient.clientId,
        clientSecret: "new-secret",
      }),
      deleteApiClient: vi.fn().mockResolvedValue(undefined),
    };
    getConfirmation = vi.fn().mockResolvedValue(true);
    openDialog = vi
      .fn()
      .mockReturnValue({ afterClosed: () => of(options.dialogResult) });

    await TestBed.configureTestingModule({
      imports: [ApiClientListComponent, MockedTestingModule.withState()],
      providers: [
        { provide: ApiClientService, useValue: apiClientService },
        { provide: ConfirmationDialogService, useValue: { getConfirmation } },
        { provide: MatDialog, useValue: { open: openDialog } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApiClientListComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const text = () => fixture.nativeElement.textContent as string;

  const clickButton = async (ariaLabel: string) =>
    (
      await loader.getHarness(
        MatButtonHarness.with({ selector: `[aria-label="${ariaLabel}"]` }),
      )
    ).click();

  it("lists the API clients with their access", async () => {
    await render({ available: true });

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(text()).toContain("Reporting dashboard");
    });
    expect(text()).toContain("api-reporting-dashboard-x7k2pq");
    expect(text()).toContain("Read reports and their results");
  });

  it("explains that API access is not available if the backend does not offer it", async () => {
    await render({ available: false });

    expect(text()).toContain("API access is not available for this system");
    expect(text()).not.toContain("New API Client");
    expect(apiClientService.getApiClients).not.toHaveBeenCalled();
  });

  it("shows the credentials of a newly created API client", async () => {
    const created = {
      credentials: { clientId: "api-new-ab12cd", clientSecret: "secret" },
      scopes: ["reporting_read"],
    };
    await render({ available: true, dialogResult: created });

    await (
      await loader.getHarness(MatButtonHarness.with({ text: /New API Client/ }))
    ).click();

    await vi.waitFor(() =>
      expect(openDialog).toHaveBeenCalledWith(
        ApiClientCredentialsDialogComponent,
        expect.objectContaining({ data: created }),
      ),
    );
    expect(openDialog).toHaveBeenCalledWith(
      CreateApiClientDialogComponent,
      expect.anything(),
    );
  });

  it.each([
    [true, 1],
    [false, 0],
  ])(
    "shows a new secret only after the regeneration is confirmed (confirmed: %s)",
    async (confirmed, expectedCalls) => {
      await render({ available: true });
      getConfirmation.mockResolvedValue(confirmed);

      await clickButton("Generate new secret");

      await vi.waitFor(() => expect(getConfirmation).toHaveBeenCalledTimes(1));
      await fixture.whenStable();
      expect(apiClientService.regenerateSecret).toHaveBeenCalledTimes(
        expectedCalls,
      );
      expect(
        openDialog.mock.calls.filter(
          ([component]) => component === ApiClientCredentialsDialogComponent,
        ),
      ).toHaveLength(expectedCalls);
    },
  );

  it("deletes an API client after confirmation and reloads the list", async () => {
    await render({ available: true });
    await vi.waitFor(() =>
      expect(apiClientService.getApiClients).toHaveBeenCalledTimes(1),
    );

    await clickButton("Delete");

    await vi.waitFor(() =>
      expect(apiClientService.deleteApiClient).toHaveBeenCalledWith(
        existingClient.clientId,
      ),
    );
    await vi.waitFor(() =>
      expect(apiClientService.getApiClients).toHaveBeenCalledTimes(2),
    );
  });
});
