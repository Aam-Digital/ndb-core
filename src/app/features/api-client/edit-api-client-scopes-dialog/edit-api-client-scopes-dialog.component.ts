import { Component, inject, signal } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import {
  ApiClient,
  ApiClientService,
  errorMessageOf,
  logRequestError,
} from "../api-client.service";
import { ApiClientScopeSelectionComponent } from "../api-client-scope-selection/api-client-scope-selection.component";

/**
 * Change the access (client scopes) of an existing API client.
 * Closes with the updated {@link ApiClient}, if it was changed.
 */
@Component({
  selector: "app-edit-api-client-scopes-dialog",
  imports: [
    MatDialogModule,
    MatButtonModule,
    DialogCloseComponent,
    ApiClientScopeSelectionComponent,
  ],
  templateUrl: "./edit-api-client-scopes-dialog.component.html",
})
export class EditApiClientScopesDialogComponent {
  private readonly apiClientService = inject(ApiClientService);
  private readonly dialogRef =
    inject<MatDialogRef<EditApiClientScopesDialogComponent, ApiClient>>(
      MatDialogRef,
    );
  readonly apiClient = inject<ApiClient>(MAT_DIALOG_DATA);

  readonly scopes = new FormControl<string[]>([...this.apiClient.scopes], {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly saving = signal(false);
  readonly error = signal<string | undefined>(undefined);

  async save() {
    if (this.scopes.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set(undefined);

    try {
      const updated = await this.apiClientService.updateScopes(
        this.apiClient.clientId,
        this.scopes.value,
      );
      this.dialogRef.close(updated);
    } catch (err) {
      logRequestError("Could not change the scopes of an API client", err);
      this.error.set(errorMessageOf(err));
    } finally {
      this.saving.set(false);
    }
  }
}
