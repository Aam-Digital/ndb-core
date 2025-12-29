import { Component, inject, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Router } from "@angular/router";
import { ConfigService } from "../../config/config.service";
import { PrimaryActionConfig } from "../../admin/admin-primary-action/primary-action-config";
import { PrimaryActionService } from "../../admin/admin-primary-action/primary-action.service";
import { EntityConfigService } from "../../entity/entity-config.service";
import { Note } from "#src/app/child-dev-project/notes/model/note";

/**
 * The "Primary Action" is always displayed hovering over the rest of the app as a quick action for the user.
 *
 * This is a UX concept also used in many Android apps.
 * see {@link https://material.io/components/buttons-floating-action-button/}
 */
@Component({
  selector: "app-primary-action",
  templateUrl: "./primary-action.component.html",
  styleUrls: ["./primary-action.component.scss"],
  imports: [
    MatButtonModule,
    Angulartics2Module,
    DisableEntityOperationDirective,
    FontAwesomeModule,
  ],
})
export class PrimaryActionComponent implements OnDestroy {
  ngOnDestroy() {
    this.configSub.unsubscribe();
  }
  private formDialog = inject(FormDialogService);
  private readonly configService = inject(ConfigService);
  private readonly entityConfigService = inject(EntityConfigService);
  private readonly router = inject(Router);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly primaryActionService = inject(PrimaryActionService);

  config: PrimaryActionConfig = this.primaryActionService.getCurrentConfig();

  private readonly configSub = this.configService.configUpdates.subscribe(
    () => {
      this.config = this.primaryActionService.getCurrentConfig();
      this.cdr.markForCheck();
    },
  );

  get entityConstructor(): EntityConstructor {
    return this.primaryActionService.getEntityConstructor(
      this.config.entityType,
    );
  }

  /**
   * The primary action to be triggered when the user clicks the hovering button.
   */
  primaryAction() {
    if (this.config.actionType === "createEntity") {
      const ctor = this.entityConstructor;
      if (ctor) {
        const newEntity = new ctor();
        this.openCreateDialog(newEntity);
      }
    } else if (this.config.actionType === "navigate" && this.config.route) {
      this.router.navigate([this.config.route]);
    }
  }

  /**
   * Open the appropriate type of dialog window for a new entity of the given type.
   */
  private openCreateDialog(entity: Entity) {
    // if view config ("view:entityType/:id") is available, then use formDialog.openView
    if (
      this.entityConfigService.getDetailsViewConfig(entity.getConstructor())
    ) {
      if (entity.getType() === Note.ENTITY_TYPE) {
        // for Note entities, pass a special component
        this.formDialog.openView(entity, "NoteDetails");
      } else {
        this.formDialog.openView(entity);
      }
    } else {
      // if no view config, then fall back to formDialog.openFormPopup
      this.formDialog.openFormPopup(entity);
    }
  }
}
