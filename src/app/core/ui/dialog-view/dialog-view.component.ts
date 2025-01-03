import { Component, Inject, Injector } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from "@angular/material/dialog";
import { EntityConfigService } from "../../entity/entity-config.service";
import { Entity } from "../../entity/model/entity";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { DynamicComponentPipe } from "../../config/dynamic-components/dynamic-component.pipe";
import { AbstractViewComponent } from "../abstract-view/abstract-view.component";
import { Router } from "@angular/router";
import { PREFIX_VIEW_CONFIG } from "../../config/dynamic-routing/view-config.interface";

/**
 * Wrapper component for a modal/dialog view
 * that takes parameters from the dialog data and passes these on to normal @Input properties.
 *
 * This allows to develop functional feature components in a way to easily reuse them for display
 * as a full page view or in a modal dialog.
 * (also see RoutedViewComponent)
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    DialogCloseComponent,
    MatDialogClose,
    DynamicComponentPipe,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
  ],
  templateUrl: "./dialog-view.component.html",
  styleUrls: ["./dialog-view.component.scss"],
})
export class DialogViewComponent<T = any> extends AbstractViewComponent {
  component: string;
  config: any;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    dialogData: DialogViewData<T>,
    injector: Injector,
    router: Router,
  ) {
    super(injector, true);

    this.component = dialogData.component;

    let viewConfig = {};
    if (dialogData.entity) {
      const detailsRoute = EntityConfigService.getDetailsViewId(
        dialogData.entity.getConstructor(),
      ).substring(PREFIX_VIEW_CONFIG.length);
      viewConfig =
        router.config.find((route) => route.path === detailsRoute)?.data
          ?.config ?? {};
    }

    if (dialogData.entity) {
      viewConfig["entity"] = dialogData.entity;
    }

    this.config = {
      ...viewConfig,
      ...dialogData.config,
    };
  }

  declare componentInjector: Injector | undefined;
}

export interface DialogViewData<T = any> {
  component: string;
  config?: T;

  /**
   * (Optional) if an EntityDetails view, the full entity record to be displayed
   */
  entity?: Entity;
}
