import { Component, Inject, Injector } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from "@angular/material/dialog";
import { EntityConfigService } from "../../entity/entity-config.service";
import { Entity } from "../../entity/model/entity";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { CdkPortalOutlet } from "@angular/cdk/portal";
import { DynamicComponentPipe } from "../../config/dynamic-components/dynamic-component.pipe";
import { AbstractViewComponent } from "../abstract-view/abstract-view.component";

/**
 * Wrapper component for a primary, full page view
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
    DynamicComponentDirective,
    ViewTitleComponent,
    DialogCloseComponent,
    MatDialogClose,
    CdkPortalOutlet,
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
    private entityConfigService: EntityConfigService,
    injector: Injector,
  ) {
    super(injector, true);

    this.component = dialogData.component;

    let viewConfig = {};
    if (dialogData.entity) {
      viewConfig =
        this.entityConfigService.getDetailsViewConfig(
          dialogData.entity.getConstructor(),
        )?.config ?? {};
    }

    if (dialogData.entity) {
      viewConfig["entity"] = dialogData.entity;
    }

    this.config = {
      ...viewConfig,
      ...dialogData.config,
    };
  }

  componentInjector: Injector | undefined;
}

export interface DialogViewData<T = any> {
  component: string;
  config?: T;

  /**
   * (Optional) if an EntityDetails view, the full entity record to be displayed
   */
  entity?: Entity;
}
