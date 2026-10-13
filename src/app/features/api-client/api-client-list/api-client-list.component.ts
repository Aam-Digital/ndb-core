import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ViewTitleComponent } from "#src/app/core/common-components/view-title/view-title.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { CustomDatePipe } from "#src/app/core/basic-datatypes/date/custom-date.pipe";
import { Logging } from "#src/app/core/logging/logging.service";
import {
  ApiClient,
  ApiClientCredentials,
  ApiClientService,
  errorMessageOf,
} from "../api-client.service";
import { getScopeLabel } from "../api-client-scopes";
import { CreateApiClientDialogComponent } from "../create-api-client-dialog/create-api-client-dialog.component";
import {
  ApiClientCredentialsDialogComponent,
  ApiClientCredentialsDialogData,
} from "../api-client-credentials-dialog/api-client-credentials-dialog.component";

/**
 * Admin page for account managers to create and manage the credentials ("API clients")
 * of external systems that access this system's data through the API.
 */
@Component({
  selector: "app-api-client-list",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ViewTitleComponent,
    HintBoxComponent,
    MatTableModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    FaIconComponent,
    CustomDatePipe,
  ],
  templateUrl: "./api-client-list.component.html",
})
export class ApiClientListComponent {
  private readonly apiClientService = inject(ApiClientService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly alertService = inject(AlertService);

  readonly isAvailable = this.apiClientService.isAvailable;
  readonly apiClients = signal<ApiClient[] | undefined>(undefined);

  readonly displayedColumns = [
    "name",
    "clientId",
    "scopes",
    "created",
    "actions",
  ];

  readonly getScopeLabel = getScopeLabel;

  constructor() {
    effect(() => {
      if (this.isAvailable()) {
        this.loadApiClients();
      }
    });
  }

  private async loadApiClients() {
    try {
      this.apiClients.set(await this.apiClientService.getApiClients());
    } catch (err) {
      Logging.warn("Could not load API clients", err);
      this.apiClients.set([]);
      this.alertService.addDanger(errorMessageOf(err));
    }
  }

  async create() {
    const dialogRef = this.dialog.open<
      CreateApiClientDialogComponent,
      unknown,
      ApiClientCredentialsDialogData
    >(CreateApiClientDialogComponent, { width: "600px" });
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.showCredentials(result);
      await this.loadApiClients();
    }
  }

  async regenerateSecret(apiClient: ApiClient) {
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Generate new secret?`,
      $localize`The external system "${apiClient.name}" cannot access the API with its current secret anymore, until you give it the new one.`,
    );
    if (!confirmed) {
      return;
    }

    let credentials: ApiClientCredentials;
    try {
      credentials = await this.apiClientService.regenerateSecret(
        apiClient.clientId,
      );
    } catch (err) {
      Logging.warn("Could not regenerate the secret of an API client", err);
      this.alertService.addDanger(errorMessageOf(err));
      return;
    }
    this.showCredentials({ credentials, scopes: apiClient.scopes });
  }

  async delete(apiClient: ApiClient) {
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Delete API client?`,
      $localize`The external system "${apiClient.name}" cannot access the API anymore. This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await this.apiClientService.deleteApiClient(apiClient.clientId);
    } catch (err) {
      Logging.warn("Could not delete an API client", err);
      this.alertService.addDanger(errorMessageOf(err));
    }
    await this.loadApiClients();
  }

  private showCredentials(data: ApiClientCredentialsDialogData) {
    this.dialog.open(ApiClientCredentialsDialogComponent, {
      data,
      width: "600px",
      // the secret is not shown again, so it must not get lost by an accidental click outside
      disableClose: true,
    });
  }
}
