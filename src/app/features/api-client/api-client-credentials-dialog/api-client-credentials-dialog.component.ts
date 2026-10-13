import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { ApiClientCredentials, ApiClientService } from "../api-client.service";
import { getScopeLabel } from "../api-client-scopes";

export interface ApiClientCredentialsDialogData {
  credentials: ApiClientCredentials;
  /** the client scopes of the API client */
  scopes: string[];
}

/**
 * Shows the credentials of an API client right after it was created (or its secret was regenerated),
 * which is the only time its secret is available, so that they can be passed on to the external system.
 */
@Component({
  selector: "app-api-client-credentials-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    FaIconComponent,
    DialogCloseComponent,
    HintBoxComponent,
  ],
  templateUrl: "./api-client-credentials-dialog.component.html",
  styleUrl: "./api-client-credentials-dialog.component.scss",
})
export class ApiClientCredentialsDialogComponent {
  private readonly apiClientService = inject(ApiClientService);
  private readonly alertService = inject(AlertService);
  private readonly data =
    inject<ApiClientCredentialsDialogData>(MAT_DIALOG_DATA);

  readonly fields: { label: string; value: string }[];
  readonly scopeLabels = this.data.scopes.map((s) => getScopeLabel(s));

  constructor() {
    const connection = this.apiClientService.getConnectionDetails();
    this.fields = [
      { label: $localize`API base URL`, value: connection.apiBaseUrl },
      { label: $localize`Token URL`, value: connection.tokenUrl },
      { label: $localize`Client ID`, value: this.data.credentials.clientId },
      {
        label: $localize`Client secret`,
        value: this.data.credentials.clientSecret,
      },
    ];
  }

  async copy(value: string) {
    await navigator.clipboard.writeText(value);
    this.alertService.addInfo($localize`Copied to clipboard`);
  }

  copyAll() {
    return this.copy(
      this.apiClientService.formatForSharing(
        this.data.credentials,
        this.data.scopes,
      ),
    );
  }
}
