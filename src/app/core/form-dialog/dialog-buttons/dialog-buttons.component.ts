import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../entity/model/entity";
import { InvalidFormFieldError } from "../../common-components/entity-form/invalid-form-field.error";
import {
  EntityForm,
  EntityFormService,
} from "../../common-components/entity-form/entity-form.service";
import { AlertService } from "../../alerts/alert.service";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Router, RouterLink } from "@angular/router";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";
import { EntityActionsMenuComponent } from "../../entity-details/entity-actions-menu/entity-actions-menu.component";
import { ViewComponentContext } from "../../ui/abstract-view/view-component-context";

@Component({
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
export class DialogButtonsComponent<E extends Entity> implements OnInit {
  private entityFormService = inject(EntityFormService);
  private dialog = inject<MatDialogRef<any>>(MatDialogRef, { optional: true });
  private alertService = inject(AlertService);
  private router = inject(Router);
  private ability = inject(EntityAbility);
  private unsavedChanges = inject(UnsavedChangesService);
  protected viewContext = inject(ViewComponentContext, { optional: true });

  @Input() entity: E;
  @Input() form: EntityForm<E>;
  detailsRoute: string;

  @Output() closeView = new EventEmitter<any>();

  constructor() {
    if (this.dialog) {
      this.initDialogSettings();
    }
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
      .subscribe(() => (this.unsavedChanges.pending = false));
  }

  ngOnInit() {
    if (!this.entity.isNew) {
      if (this.ability.cannot("update", this.entity)) {
        this.form.formGroup.disable();
      }
      this.initializeDetailsRouteIfAvailable();
    }
  }

  private initializeDetailsRouteIfAvailable() {
    let route = this.entity.getConstructor().route;
    if (
      route &&
      this.router.config.some((r) => "/" + r.path === route + "/:id")
    ) {
      this.detailsRoute = route + "/" + this.entity.getId(true);
    }
  }

  async save() {
    this.entityFormService
      .saveChanges(this.form, this.entity)
      .then((res) => {
        // Attachments are only saved once form is disabled
        this.form.formGroup.disable();
        this.form.formGroup.markAsPristine();
        this.close(res);
      })
      .catch((err) => {
        if (!(err instanceof InvalidFormFieldError)) {
          this.alertService.addDanger(err.message);
        }
      });
  }

  cancel() {
    this.unsavedChanges.pending = false;
    this.close();
  }

  close(result?: any) {
    this.dialog?.close(result);
    this.closeView.emit(result);

    this.unsavedChanges.pending = false;
  }

  onAction(action: string) {
    if (action === "delete") {
      this.close();
    }
  }
}
