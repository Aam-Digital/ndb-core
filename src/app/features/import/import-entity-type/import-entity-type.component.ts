import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ParsedData } from "../../data-import/input-file/input-file.component";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";

/**
 * Import sub-step: Let user select which entity type data should be imported as.
 */
@Component({
  selector: "app-import-entity-type",
  templateUrl: "./import-entity-type.component.html",
  styleUrls: ["./import-entity-type.component.scss"],
})
export class ImportEntityTypeComponent {
  /**
   * Data to be imported, to allow the component to infer suitable entity type.
   */
  @Input() rawData: ParsedData<any>;

  /** user selected entity type */
  @Output() entityTypeChange = new EventEmitter<string>();
  /** pre-selected entity type */
  @Input() entityType: string;

  constructor(public entityTypes: EntityRegistry) {}

  // TODO: infer entityType automatically -> pre-select + UI explanatory text
}
