import {
  Component,
  inject,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  effect,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../entity/model/entity";
import { InvalidFormFieldError } from "../../common-components/entity-form/invalid-form-field.error";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { AlertService } from "../../alerts/alert.service";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Router, RouterLink } from "@angular/router";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";
import { EntityActionsMenuComponent } from "../../entity-details/entity-actions-menu/entity-actions-menu.component";
import { ViewComponentContext } from "../../ui/abstract-view/view-component-context";
import { getEntityRuntimeRoute } from "../../entity/entity-config.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-dialog-buttons",
  imports: [
    MatButtonModule,
    Angulartics2Module,
    MatDialogModule,
    MatMenuModule,
    FontAwesomeModule,
    RouterLink,
    EntityActionsMenuComponent,
  ],
  templateUrl: "./dialog-buttons.component.html",
  styleUrls: ["./dialog-buttons.component.scss"],
})
export class DialogButtonsComponent<E extends Entity> {
  private entityFormService = inject(EntityFormService);
  private dialog = inject<MatDialogRef<any>>(MatDialogRef, { optional: true });
  private alertService = inject(AlertService);
  private router = inject(Router);
  private ability = inject(EntityAbility);
  private unsavedChanges = inject(UnsavedChangesService);

  protected viewContext = inject(ViewComponentContext, { optional: true });

  entity = input.required<E>();
  form = input.required<EntityForm<E>>();
  closeView = output<any>();

  detailsRoute = computed(() => {
    const entity = this.entity();
    if (entity.isNew) {
      return undefined;
    }
    const route = getEntityRuntimeRoute(entity.getConstructor());
    const detailsPath = `${route.replace(/^\//, "")}/:id`;
    if (route && this.router.config.some((r) => r.path === detailsPath)) {
      return route + "/" + entity.getId(true);
    }
    return undefined;
  });

  constructor() {
    if (this.dialog) {
      this.initDialogSettings();
    }

    // Handle permissions check when entity changes
    effect(() => {
      const entity = this.entity();
      const form = this.form();
      if (!entity.isNew) {
        if (this.ability.cannot("update", entity)) {
          form.formGroup.disable();
        }
      }
    });
  }

  private initDialogSettings() {
    this.dialog.disableClose = true;
    this.dialog.backdropClick().subscribe(() =>
      this.unsavedChanges.checkUnsavedChanges().then((confirmed) => {
        if (confirmed) {
          this.dialog.close();
        }
      }),
    );
    // This happens before the `canDeactivate` check and therefore does not warn when leaving
    this.dialog
      .afterClosed()
      .subscribe(() => this.unsavedChanges.pending.set(false));
  }

  async save() {
    this.entityFormService
      .saveChanges(this.form(), this.entity())
      .then((res) => {
        // Attachments are only saved once form is disabled
        this.form().formGroup.disable();
        this.form().formGroup.markAsPristine();
        this.close(res);
      })
      .catch((err) => {
        if (!(err instanceof InvalidFormFieldError)) {
          this.alertService.addDanger(err.message);
        }
      });
  }

  cancel() {
    this.unsavedChanges.pending.set(false);
    this.close();
  }

  close(result?: any) {
    this.dialog?.close(result);
    this.closeView.emit(result);

    this.unsavedChanges.pending.set(false);
  }

  onAction(action: string) {
    if (action === "delete") {
      this.close();
    }
  }
}
