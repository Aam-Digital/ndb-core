import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
  Input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import {
  LinkExternalProfileDialogComponent,
  LinkExternalProfileDialogData,
} from "./link-external-profile-dialog/link-external-profile-dialog.component";
import { ExternalProfile } from "../skill-api/external-profile";
import { EditComponent } from "../../../core/common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { MatFormFieldControl } from "@angular/material/form-field";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { Entity } from "../../../core/entity/model/entity";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltip } from "@angular/material/tooltip";
import { SkillApiService } from "../skill-api/skill-api.service";
import { FormsModule, ReactiveFormsModule, FormControl } from "@angular/forms";
import { ExternalProfileLinkConfig } from "../external-profile-link-config";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { catchError } from "rxjs/operators";
import { retryOnServerError } from "../../../utils/retry-on-server-error.rxjs-pipe";
import { of } from "rxjs";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("EditExternalProfileLink")
@Component({
  selector: "app-edit-external-profile-link",
  standalone: true,
  imports: [
    MatButton,
    FaIconComponent,
    MatTooltip,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./edit-external-profile-link.component.html",
  styleUrl: "./edit-external-profile-link.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditExternalProfileLinkComponent,
    },
  ],
})
export class EditExternalProfileLinkComponent
  extends CustomFormControlDirective<string>
  implements OnInit, EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;
  @Input() entity?: Entity;

  /**
   * The configuration details for this external profile link,
   * defined in the config field's `additional` property.
   */
  get additional(): ExternalProfileLinkConfig {
    return this.formFieldConfig?.additional as ExternalProfileLinkConfig;
  }

  isLoading: WritableSignal<boolean> = signal(false);
  externalProfile: ExternalProfile | undefined;
  externalProfileError: boolean;
  isDisabled = signal(false);

  get formControl(): FormControl<string> {
    return this.ngControl.control as FormControl<string>;
  }

  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly skillApi: SkillApiService = inject(SkillApiService);

  ngOnInit() {
    this.formControl.statusChanges.subscribe(() => {
      this.isDisabled.set(this.formControl.disabled);
    });

    this.isDisabled.set(this.formControl.disabled);

    if (this.formControl.value) {
      this.skillApi
        .getExternalProfileById(this.formControl.value)
        .pipe(
          retryOnServerError(2),
          catchError(() => {
            this.externalProfileError = true;
            return of(undefined);
          }),
        )
        .subscribe((profile) => {
          this.externalProfile = profile;
        });
    }
  }

  async searchMatchingProfiles() {
    const currentEntity = Object.assign(
      {},
      this.entity,
      // Todo: In the new architecture, we don't have direct access to parent form
      // This might need to be passed as an input or accessed differently
      // For now, using just the entity
    );

    this.dialog
      .open(LinkExternalProfileDialogComponent, {
        data: {
          entity: currentEntity,
          config: this.additional,
        } as LinkExternalProfileDialogData,
      })
      .afterClosed()
      .subscribe((result: ExternalProfile | undefined) => {
        if (result) {
          this.linkProfile(result);
        }
      });
  }

  unlinkExternalProfile() {
    this.externalProfile = undefined;
    this.formControl.setValue(null);
    this.formControl.markAsDirty();
  }

  async updateExternalData() {
    this.isLoading.set(true);

    if (!this.formControl.value) {
      return;
    }

    // Todo: In the new architecture, parent form access needs to be handled differently
    // This functionality may need to be refactored or the parent form passed as input
    // await this.skillApi.applyDataFromExternalProfile(
    //   this.formControl.value,
    //   this.additional,
    //   this.parent,
    // );

    this.isLoading.set(false);
    // TODO: run import / update automatically?
  }

  private linkProfile(externalProfile: ExternalProfile) {
    this.externalProfile = externalProfile;
    this.formControl.setValue(externalProfile.id);
    this.formControl.markAsDirty();
  }
}
