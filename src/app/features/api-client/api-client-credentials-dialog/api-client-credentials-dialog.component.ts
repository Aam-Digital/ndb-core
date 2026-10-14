import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Clipboard } from "@angular/cdk/clipboard";
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
  private readonly clipboard = inject(Clipboard);
  private readonly data =
    inject<ApiClientCredentialsDialogData>(MAT_DIALOG_DATA);

  readonly fields: { label: string; value: string; copyLabel: string }[];
  readonly scopeLabels = this.data.scopes.map((s) => getScopeLabel(s));

  constructor() {
    const connection = this.apiClientService.getConnectionDetails();
    this.fields = [
      {
        label: $localize`API base URL`,
        value: connection.apiBaseUrl,
        copyLabel: $localize`Copy API base URL`,
      },
      {
        label: $localize`Token URL`,
        value: connection.tokenUrl,
        copyLabel: $localize`Copy token URL`,
      },
      {
        label: $localize`Client ID`,
        value: this.data.credentials.clientId,
        copyLabel: $localize`Copy client ID`,
      },
      {
        label: $localize`Client secret`,
        value: this.data.credentials.clientSecret,
        copyLabel: $localize`Copy client secret`,
      },
    ];
  }

  copy(value: string) {
    if (this.clipboard.copy(value)) {
      this.alertService.addInfo($localize`Copied to clipboard`);
    } else {
      this.alertService.addWarning(
        $localize`Could not copy to the clipboard. Please select and copy the text instead.`,
      );
    }
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
