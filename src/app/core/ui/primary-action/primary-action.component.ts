import { Component, inject } from "@angular/core";
import { ChangeDetectorRef, OnDestroy } from "@angular/core";
import { Note } from "../../../child-dev-project/notes/model/note";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Router } from "@angular/router";
import { ConfigService } from "../../config/config.service";
import { PrimaryActionConfig } from "../../config/primary-action-config";
import { Todo } from "../../../features/todos/model/todo";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { ActivityAttendance } from "../../../child-dev-project/attendance/model/activity-attendance";

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
  private configService = inject(ConfigService);
  private router = inject(Router);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  private defaultConfig: PrimaryActionConfig = {
    icon: "plus",
    actionType: "createEntity",
    entityType: "Note",
  };

  private entityRegistry: Record<string, any> = {
    Note,
    Todo,
    RecurringActivity,
    ActivityAttendance,
  };

  config: PrimaryActionConfig = this.defaultConfig;

  private configSub = this.configService.configUpdates.subscribe(() => {
    this.config =
      this.configService.getConfig<PrimaryActionConfig>("primaryAction") ??
      this.defaultConfig;
    this.cdr.markForCheck();
  });

  get entityConstructor() {
    const ctor = this.entityRegistry[this.config.entityType ?? "Note"];
    return ctor ?? this.entityRegistry["Note"];
  }

  /**
   * The primary action to be triggered when the user clicks the hovering button.
   */
  primaryAction() {
    if (this.config.actionType === "createEntity") {
      const ctor = this.entityRegistry[this.config.entityType ?? "Note"];
      if (ctor) {
        this.formDialog.openView(new ctor(), "EntityDetails");
      } else {
        this.formDialog.openView(new Note(), "EntityDetails");
      }
    } else if (this.config.actionType === "navigate" && this.config.route) {
      this.router.navigate([this.config.route]);
    }
  }
}
