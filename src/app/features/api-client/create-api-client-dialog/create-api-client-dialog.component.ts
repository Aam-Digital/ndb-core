import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import {
  API_CLIENT_ID_PREFIX,
  ApiClientService,
  errorMessageOf,
  logRequestError,
} from "../api-client.service";
import { ApiClientScopeSelectionComponent } from "../api-client-scope-selection/api-client-scope-selection.component";
import { ApiClientCredentialsDialogData } from "../api-client-credentials-dialog/api-client-credentials-dialog.component";

/**
 * Create an API client, with a name and the access (client scopes) the user selects.
 * Closes with the {@link ApiClientCredentialsDialogData} of the new API client, if it was created.
 */
@Component({
  selector: "app-create-api-client-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    DialogCloseComponent,
    ApiClientScopeSelectionComponent,
  ],
  templateUrl: "./create-api-client-dialog.component.html",
})
export class CreateApiClientDialogComponent {
  private readonly apiClientService = inject(ApiClientService);
  private readonly dialogRef =
    inject<
      MatDialogRef<
        CreateApiClientDialogComponent,
        ApiClientCredentialsDialogData
      >
    >(MatDialogRef);

  readonly MAX_NAME_LENGTH = 100;

  readonly form = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        // the backend rejects a name of only spaces
        Validators.pattern(/\S/),
        Validators.maxLength(this.MAX_NAME_LENGTH),
      ],
    }),
    // the part after API_CLIENT_ID_PREFIX; empty to let the backend generate it from the name
    clientId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9._-]{0,59}$/)],
    }),
    scopes: new FormControl<string[]>([], {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly CLIENT_ID_PREFIX = API_CLIENT_ID_PREFIX;

  readonly saving = signal(false);
  readonly error = signal<string | undefined>(undefined);

  private readonly clientIdValue = toSignal(
    this.form.controls.clientId.valueChanges,
    { initialValue: "" },
  );
  /** the part of the client ID the user chose, if any */
  readonly chosenClientId = computed(() => this.clientIdValue().trim());

  async create() {
    if (this.form.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set(undefined);

    const { name, clientId, scopes } = this.form.getRawValue();
    try {
      const credentials = await this.apiClientService.createApiClient(
        name.trim(),
        scopes,
        clientId.trim() ? API_CLIENT_ID_PREFIX + clientId.trim() : undefined,
      );
      this.dialogRef.close({ credentials, scopes });
    } catch (err) {
      logRequestError("Could not create API client", err);
      this.error.set(errorMessageOf(err));
    } finally {
      this.saving.set(false);
    }
  }
}
