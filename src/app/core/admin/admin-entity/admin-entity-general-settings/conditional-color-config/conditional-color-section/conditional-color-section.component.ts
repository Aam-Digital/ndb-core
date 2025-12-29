import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ColorMapping, EntityConstructor } from "app/core/entity/model/entity";
import { ColorInputComponent } from "#src/app/core/common-components/color-input/color-input.component";
import { ConditionsEditorComponent } from "app/core/common-components/conditions-editor/conditions-editor.component";

/**
 * Component for managing a single conditional color section
 */
@Component({
  selector: "app-conditional-color-section",
  templateUrl: "./conditional-color-section.component.html",
  styleUrls: ["./conditional-color-section.component.scss"],
  imports: [
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
    ColorInputComponent,
    ConditionsEditorComponent,
  ],
})
export class ConditionalColorSectionComponent {
  @Input() section: ColorMapping;
  @Input() entityConstructor: EntityConstructor;

  @Output() colorChange = new EventEmitter<string>();
  @Output() deleteSection = new EventEmitter<void>();
  @Output() conditionChange = new EventEmitter<void>();

  /**
   * Handle conditions change from the conditions editor
   */
  onConditionsChange(updatedConditions: any): void {
    this.section.condition = updatedConditions;
    this.conditionChange.emit();
  }
}
