import { Component, computed, inject, input, resource } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatListModule } from "@angular/material/list";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { startWith, switchMap } from "rxjs";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { ApiClientService, errorMessageOf } from "../api-client.service";
import { getScopeLabel, SINGLE_SIGN_ON_SCOPE } from "../api-client-scopes";

/**
 * Select the access (client scopes) of an API client, from those the backend offers.
 */
@Component({
  selector: "app-api-client-scope-selection",
  imports: [
    MatListModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    HintBoxComponent,
  ],
  templateUrl: "./api-client-scope-selection.component.html",
})
export class ApiClientScopeSelectionComponent {
  private readonly apiClientService = inject(ApiClientService);

  /** the names of the selected client scopes */
  readonly control = input.required<FormControl<string[]>>();

  /** the client scopes the API client can be given */
  readonly scopes = resource({
    loader: async () =>
      (await this.apiClientService.getScopes()).map((scope) => ({
        name: scope.name,
        label: getScopeLabel(scope.name, scope.description),
      })),
  });
  readonly loadingError = computed(() =>
    this.scopes.error() ? errorMessageOf(this.scopes.error()) : undefined,
  );

  private readonly selectedScopes = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.valueChanges.pipe(startWith(control.value)),
      ),
    ),
    { initialValue: [] as string[] },
  );

  readonly singleSignOnSelected = computed(() =>
    this.selectedScopes().includes(SINGLE_SIGN_ON_SCOPE),
  );
}
