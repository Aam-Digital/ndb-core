import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  Optional,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { Entity } from "../../entity/model/entity";
import { FormGroup } from "@angular/forms";
import { InvalidFormFieldError } from "../../common-components/entity-form/invalid-form-field.error";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { AlertService } from "../../alerts/alert.service";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Router, RouterLink } from "@angular/router";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";
import { EntityActionsMenuComponent } from "../../entity-details/entity-actions-menu/entity-actions-menu.component";
import { ViewComponentContext } from "../../ui/abstract-view/abstract-view.component";

@Component({
  selector: "app-dialog-buttons",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    Angulartics2Module,
    MatDialogModule,
    DisableEntityOperationDirective,
    MatMenuModule,
    FontAwesomeModule,
    RouterLink,
    EntityActionsMenuComponent,
  ],
  templateUrl: "./dialog-buttons.component.html",
  styleUrls: ["./dialog-buttons.component.scss"],
})
export class DialogButtonsComponent implements OnInit, AfterViewInit {
  @ViewChild("template") template: TemplateRef<any>;

  @Input() entity: Entity;
  @Input() form: FormGroup;
  detailsRoute: string;

  constructor(
    private entityFormService: EntityFormService,
    @Optional() private dialog: MatDialogRef<any>,
    private alertService: AlertService,
    private router: Router,
    private ability: EntityAbility,
    private unsavedChanges: UnsavedChangesService,
    @Optional() protected viewContext: ViewComponentContext,
  ) {
    if (this.dialog) {
      // TODO: generalize this logic to work in routed as well as dialog views
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
        this.form.disable();
      }
      this.initializeDetailsRouteIfAvailable();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => (this.viewContext.actions = this));
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
        this.form.disable();
        this.form.markAsPristine();
        this.dialog.close(res);
      })
      .catch((err) => {
        if (!(err instanceof InvalidFormFieldError)) {
          this.alertService.addDanger(err.message);
        }
      });
  }

  onAction(action: string) {
    if (action === "delete") {
      this.dialog.close();
    }
  }
}
