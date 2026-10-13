import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
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
import { MatListModule } from "@angular/material/list";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { Logging } from "#src/app/core/logging/logging.service";
import {
  ApiClientScope,
  ApiClientService,
  errorMessageOf,
} from "../api-client.service";
import { getScopeLabel, SINGLE_SIGN_ON_SCOPE } from "../api-client-scopes";
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
    MatListModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    DialogCloseComponent,
    HintBoxComponent,
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
        Validators.maxLength(this.MAX_NAME_LENGTH),
      ],
    }),
    scopes: new FormControl<string[]>([], {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  /** the client scopes the API client can be given */
  readonly scopes = resource({
    loader: () => this.apiClientService.getScopes(),
  });
  readonly saving = signal(false);
  private readonly createError = signal<string | undefined>(undefined);
  readonly error = computed(
    () =>
      this.createError() ??
      (this.scopes.error() ? errorMessageOf(this.scopes.error()) : undefined),
  );

  private readonly selectedScopes = toSignal(
    this.form.controls.scopes.valueChanges,
    { initialValue: [] as string[] },
  );
  readonly singleSignOnSelected = computed(() =>
    this.selectedScopes().includes(SINGLE_SIGN_ON_SCOPE),
  );

  readonly getScopeLabel = (scope: ApiClientScope) =>
    getScopeLabel(scope.name, scope.description);

  async create() {
    if (this.form.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.createError.set(undefined);

    const { name, scopes } = this.form.getRawValue();
    try {
      const credentials = await this.apiClientService.createApiClient(
        name.trim(),
        scopes,
      );
      this.dialogRef.close({ credentials, scopes });
    } catch (err) {
      Logging.warn("Could not create API client", err);
      this.createError.set(errorMessageOf(err));
    } finally {
      this.saving.set(false);
    }
  }
}
