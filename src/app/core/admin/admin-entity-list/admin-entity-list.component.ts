import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FilterComponent } from "../../filter/filter/filter.component";
import { MatTab, MatTabGroup } from "@angular/material/tabs";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import { EntityConstructor } from "../../entity/model/entity";
import {
  EntityListConfig,
  GroupConfig,
} from "../../entity-list/EntityListConfig";
import { EntityFieldsMenuComponent } from "../../common-components/entity-fields-menu/entity-fields-menu.component";
import { ColumnConfig } from "../../common-components/entity-form/FormConfig";
import { MatTableModule } from "@angular/material/table";
import { EntityFieldLabelComponent } from "../../common-components/entity-field-label/entity-field-label.component";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragEnter,
  CdkDropList,
  CdkDropListGroup,
  DragRef,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatIconButton } from "@angular/material/button";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatSelect } from "@angular/material/select";
import { AdminTabsComponent } from "../building-blocks/admin-tabs/admin-tabs.component";
import { AdminTabTemplateDirective } from "../building-blocks/admin-tabs/admin-tab-template.directive";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";

@Component({
  selector: "app-admin-entity-list",
  standalone: true,
  imports: [
    CommonModule,
    FilterComponent,
    MatTabGroup,
    EntitiesTableComponent,
    MatTab,
    EntityFieldsMenuComponent,
    MatTableModule,
    EntityFieldLabelComponent,
    CdkDrag,
    FaIconComponent,
    MatIconButton,
    CdkDropList,
    MatFormField,
    MatLabel,
    MatSelect,
    AdminTabsComponent,
    AdminTabTemplateDirective,
    ViewTitleComponent,
    CdkDropListGroup,
  ],
  templateUrl: "./admin-entity-list.component.html",
  styleUrls: [
    "./admin-entity-list.component.scss",
    "../admin-entity/admin-entity-styles.scss",
  ],
})
export class AdminEntityListComponent implements OnChanges, AfterViewInit {
  @ViewChild(CdkDropList) placeholder: CdkDropList;

  private target: CdkDropList = null;
  private targetIndex: number;
  private source: CdkDropList = null;
  private sourceIndex: number;
  private dragRef: DragRef = null;
  @Input() entityConstructor: EntityConstructor;
  @Input() config: EntityListConfig;

  allFields: ColumnConfig[] = [];
  filters: string[];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) {
      this.config = this.config ?? {
        entityType: this.entityConstructor.ENTITY_TYPE,
      };
      this.config.filters = this.config.filters ?? [];

      this.initColumnGroupsIfNecessary();

      this.initAvailableFields();
    }
  }
  ngAfterViewInit() {
    const placeholderElement = this.placeholder.element.nativeElement;
    placeholderElement.style.display = "none";
    placeholderElement.parentNode.removeChild(placeholderElement);
  }
  /**
   * Config allows to not have columnGroups and by default then display all `columns`,
   * create an initial columnGroup in this case to allow full editing.
   * @private
   */
  private initColumnGroupsIfNecessary() {
    if (!this.config.columnGroups) {
      this.config.columnGroups = {
        groups: [
          {
            name: "",
            columns: (this.config.columns ?? []).map((c) =>
              typeof c === "string" ? c : c.id,
            ),
          },
        ],
      };
    }
  }

  private initAvailableFields() {
    this.allFields = [
      ...(this.config.columns ?? []),
      ...this.entityConstructor.schema.keys(),
    ];
    this.filters = (this.config.filters ?? []).map((f) => f.id);
  }

  onDropListDropped() {
    if (!this.target) {
      return;
    }
    const placeholderElement: HTMLElement =
      this.placeholder.element.nativeElement;
    const placeholderParentElement: HTMLElement =
      placeholderElement.parentElement;
    placeholderElement.style.display = "none";
    placeholderParentElement.removeChild(placeholderElement);
    placeholderParentElement.appendChild(placeholderElement);
    placeholderParentElement.insertBefore(
      this.source.element.nativeElement,
      placeholderParentElement.children[this.sourceIndex],
    );

    if (this.placeholder._dropListRef.isDragging()) {
      this.placeholder._dropListRef.exit(this.dragRef);
    }
    this.target = null;
    this.source = null;
    this.dragRef = null;
    if (this.sourceIndex !== this.targetIndex) {
      moveItemInArray(this.config.filters, this.sourceIndex, this.targetIndex);
    }
  }

  onDropListEntered({ item, container }: CdkDragEnter) {
    if (container == this.placeholder) {
      return;
    }
    const placeholderElement: HTMLElement =
      this.placeholder.element.nativeElement;
    const sourceElement: HTMLElement = item.dropContainer.element.nativeElement;
    const dropElement: HTMLElement = container.element.nativeElement;
    const dragIndex: number = Array.prototype.indexOf.call(
      dropElement.parentElement.children,
      this.source ? placeholderElement : sourceElement,
    );
    const dropIndex: number = Array.prototype.indexOf.call(
      dropElement.parentElement.children,
      dropElement,
    );

    if (!this.source) {
      this.sourceIndex = dragIndex;
      this.source = item.dropContainer;
      sourceElement.parentElement.removeChild(sourceElement);
    }
    this.targetIndex = dropIndex;
    this.target = container;
    this.dragRef = item._dragRef;
    placeholderElement.style.display = "";
    dropElement.parentElement.insertBefore(
      placeholderElement,
      dropIndex > dragIndex ? dropElement.nextSibling : dropElement,
    );
    this.placeholder._dropListRef.enter(
      item._dragRef,
      item.element.nativeElement.offsetLeft,
      item.element.nativeElement.offsetTop,
    );
  }

  updateFilters(filters: string[]) {
    this.filters = filters;
    this.config.filters = filters.map(
      (f) =>
        this.config.filters.find(
          (existingFilter) => existingFilter.id === f,
        ) ?? { id: f },
    );
  }

  newColumnGroupFactory(): GroupConfig {
    return { name: "", columns: [] };
  }

  removeItem<E>(array: E[], item: E) {
    array.splice(array.indexOf(item), 1);
  }

  drop<E>(event: CdkDragDrop<E[], any>, columnsArray: E[]) {
    moveItemInArray(columnsArray, event.previousIndex, event.currentIndex);
  }
}
