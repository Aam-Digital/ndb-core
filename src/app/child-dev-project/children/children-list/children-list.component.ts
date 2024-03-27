import { Component } from "@angular/core";
import { Child } from "../model/child";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ChildrenService } from "../children.service";
import { EntityListComponent } from "../../../core/entity-list/entity-list/entity-list.component";
import { RouteTarget } from "../../../route-target";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import { DuplicateRecordService } from "../../../core/entity-list/duplicate-records/duplicate-records.service";
import { EntityActionsService } from "../../../core/entity/entity-actions/entity-actions.service";
import {
  AsyncPipe,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet,
} from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2OnModule } from "angulartics2";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { MatTabsModule } from "@angular/material/tabs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { FormsModule } from "@angular/forms";
import { FilterComponent } from "../../../core/filter/filter/filter.component";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { ExportDataDirective } from "../../../core/export/export-data-directive/export-data.directive";
import { DisableEntityOperationDirective } from "../../../core/permissions/permission-directive/disable-entity-operation.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityCreateButtonComponent } from "../../../core/common-components/entity-create-button/entity-create-button.component";
import { AbilityModule } from "@casl/angular";
import { EntityActionsMenuComponent } from "../../../core/entity-details/entity-actions-menu/entity-actions-menu.component";

@RouteTarget("ChildrenList")
@Component({
  selector: "app-children-list",
  templateUrl:
    "../../../core/entity-list/entity-list/entity-list.component.html",
  styleUrls: [
    "../../../core/entity-list/entity-list/entity-list.component.scss",
  ],
  standalone: true,

  imports: [
    NgIf,
    NgStyle,
    MatButtonModule,
    Angulartics2OnModule,
    FontAwesomeModule,
    MatMenuModule,
    NgTemplateOutlet,
    MatTabsModule,
    NgForOf,
    MatFormFieldModule,
    MatInputModule,
    EntitiesTableComponent,
    FormsModule,
    FilterComponent,
    TabStateModule,
    ViewTitleComponent,
    ExportDataDirective,
    DisableEntityOperationDirective,
    RouterLink,
    MatTooltipModule,
    EntityCreateButtonComponent,
    AbilityModule,
    AsyncPipe,
    EntityActionsMenuComponent,
  ],
})
export class ChildrenListComponent extends EntityListComponent<Child> {
  override entityConstructor = Child;

  constructor(
    screenWidthObserver: ScreenWidthObserver,
    router: Router,
    activatedRoute: ActivatedRoute,
    entityMapperService: EntityMapperService,
    entities: EntityRegistry,
    dialog: MatDialog,
    duplicateRecord: DuplicateRecordService,
    entityActionsService: EntityActionsService,
    private childrenService: ChildrenService,
  ) {
    super(
      screenWidthObserver,
      router,
      activatedRoute,
      entityMapperService,
      entities,
      dialog,
      duplicateRecord,
      entityActionsService,
    );
  }

  override async getEntities() {
    return this.childrenService.getChildren();
  }
}
