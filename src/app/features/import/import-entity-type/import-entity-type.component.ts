import { Component, EventEmitter, Input, Output } from "@angular/core";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { NgForOf } from "@angular/common";
import { HelpButtonComponent } from "../../../core/common-components/help-button/help-button.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";

/**
 * Import sub-step: Let user select which entity type data should be imported as.
 */
@Component({
  selector: "app-import-entity-type",
  templateUrl: "./import-entity-type.component.html",
  styleUrls: ["./import-entity-type.component.scss"],
  standalone: true,
  imports: [
    MatInputModule,
    MatSelectModule,
    NgForOf,
    HelpButtonComponent,
    MatSlideToggleModule,
    FormsModule,
  ],
})
export class ImportEntityTypeComponent {
  /** user selected entity type */
  @Output() entityTypeChange = new EventEmitter<string>();
  /** pre-selected entity type */
  @Input() entityType: string;

  /**
   * Whether to show all, including administrative, entity types for selection.
   */
  get expertMode(): boolean {
    return this._expertMode;
  }

  set expertMode(value: boolean) {
    this.loadEntityTypes(value);
  }

  private _expertMode: boolean = false;

  entityTypes: { key: string; value: EntityConstructor }[];

  constructor(public entityRegistry: EntityRegistry) {
    this.loadEntityTypes();
  }

  private loadEntityTypes(expertMode?: boolean) {
    let entities = Array.from(this.entityRegistry.entries()).map(
      ([key, value]) => ({ key, value })
    );
    if (!expertMode) {
      entities = entities.filter(({ key, value }) => value._isCustomizedType);
    }
    this.entityTypes = entities;
  }

  // TODO: infer entityType automatically -> pre-select + UI explanatory text
}
