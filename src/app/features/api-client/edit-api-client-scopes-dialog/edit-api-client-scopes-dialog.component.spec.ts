import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatButtonHarness } from "@angular/material/button/testing";
import { MatSelectionListHarness } from "@angular/material/list/testing";
import type { Mock } from "vitest";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EditApiClientScopesDialogComponent } from "./edit-api-client-scopes-dialog.component";
import { ApiClient, ApiClientService } from "../api-client.service";

describe("EditApiClientScopesDialogComponent", () => {
  let fixture: ComponentFixture<EditApiClientScopesDialogComponent>;
  let loader: HarnessLoader;
  let apiClientService: { getScopes: Mock; updateScopes: Mock };
  let dialogRef: { close: Mock };

  const apiClient: ApiClient = {
    clientId: "api-crm-x7k2pq",
    name: "CRM",
    scopes: ["reporting_read"],
  };

  beforeEach(async () => {
    apiClientService = {
      getScopes: vi.fn().mockResolvedValue([
        { name: "reporting_read", description: "" },
        { name: "reporting_write", description: "" },
      ]),
      updateScopes: vi.fn(),
    };
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [EditApiClientScopesDialogComponent, FontAwesomeTestingModule],
      providers: [
        { provide: ApiClientService, useValue: apiClientService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: apiClient },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditApiClientScopesDialogComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  async function changeAccessAndSave() {
    const list = await loader.getHarness(MatSelectionListHarness);
    await list.deselectItems({ title: /Read reports/ });
    await list.selectItems({ title: /Calculate reports/ });
    await (
      await loader.getHarness(MatButtonHarness.with({ text: "Save" }))
    ).click();
  }

  it("changes the access of the API client and passes the updated client on", async () => {
    const updated = { ...apiClient, scopes: ["reporting_write"] };
    apiClientService.updateScopes.mockResolvedValue(updated);

    await changeAccessAndSave();

    await vi.waitFor(() =>
      expect(dialogRef.close).toHaveBeenCalledWith(updated),
    );
    expect(apiClientService.updateScopes).toHaveBeenCalledWith(
      "api-crm-x7k2pq",
      ["reporting_write"],
    );
  });

  it("shows why the backend refused to change the access", async () => {
    apiClientService.updateScopes.mockRejectedValue(
      new HttpErrorResponse({
        status: 404,
        error: { errorMessage: "There is no API client 'api-crm-x7k2pq'" },
      }),
    );

    await changeAccessAndSave();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
      ).toContain("There is no API client");
    });
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
