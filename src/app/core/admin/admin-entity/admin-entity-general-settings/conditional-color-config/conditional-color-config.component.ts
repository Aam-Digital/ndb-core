import { Component, Input, Output, EventEmitter } from "@angular/core";
import {
  MatFormFieldModule,
  MatFormFieldControl,
} from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { ColorMapping, EntityConstructor } from "app/core/entity/model/entity";
import { ColorInputComponent } from "#src/app/core/common-components/color-input/color-input.component";
import { ConditionalColorSectionComponent } from "./conditional-color-section/conditional-color-section.component";

/**
 * A form control for configuring conditional colors based on entity fields.
 */
@Component({
  selector: "app-conditional-color-config",
  templateUrl: "./conditional-color-config.component.html",
  styleUrls: ["./conditional-color-config.component.scss"],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: ConditionalColorConfigComponent,
    },
  ],
  imports: [
    MatFormFieldModule,
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
    ColorInputComponent,
    ConditionalColorSectionComponent,
  ],
})
export class ConditionalColorConfigComponent extends CustomFormControlDirective<
  string | ColorMapping[]
> {
  @Input() entityConstructor: EntityConstructor;
  @Input() isConditionalMode: boolean = false;
  @Output() isConditionalModeChange = new EventEmitter<boolean>();

  // Cached values to avoid recalculating in template
  get staticColor(): string {
    if (typeof this.value === "string") return this.value;
    if (!Array.isArray(this.value)) return "";
    return (
      this.value.find((m) => !Object.keys(m.condition || {}).length)?.color ||
      ""
    );
  }

  get conditionalColorSections(): ColorMapping[] {
    if (!Array.isArray(this.value)) return [];
    return this.value.filter((m) => Object.keys(m.condition || {}).length > 0);
  }

  /**
   * Add a new conditional color section
   */
  addConditionalColorSection(): void {
    // Enable conditional mode if not already enabled
    if (!this.isConditionalMode) {
      this.isConditionalModeChange.emit(true);
    }

    if (!Array.isArray(this.value)) {
      this.value = [{ condition: {}, color: this.staticColor }];
    }

    // Add new conditional section with one empty condition to start
    const newSection: ColorMapping = {
      condition: { $or: [{}] },
      color: "",
    };

    this.value = [...this.value, newSection];
    this.onChange(this.value);
  }

  /**
   * Delete a conditional color section
   */
  deleteConditionalColorSection(sectionIndex: number): void {
    if (!Array.isArray(this.value)) return;

    const conditionalSections = this.conditionalColorSections;
    if (sectionIndex < 0 || sectionIndex >= conditionalSections.length) return;

    // Remove the section
    const staticMapping = this.value.find(
      (m) => !Object.keys(m.condition || {}).length,
    );
    const remainingSections = conditionalSections.filter(
      (_, index) => index !== sectionIndex,
    );

    this.value = staticMapping
      ? [staticMapping, ...remainingSections]
      : remainingSections;
    this.onChange(this.value);
  }

  /**
   * Update the color for a conditional section
   */
  updateConditionalSectionColor(sectionIndex: number, newColor: string): void {
    const conditionalSections = this.conditionalColorSections;
    if (sectionIndex < 0 || sectionIndex >= conditionalSections.length) return;

    conditionalSections[sectionIndex].color = newColor;
    this.updateValue();
  }

  /**
   * Handle any change in conditional sections that requires value update
   */
  onConditionChange(): void {
    this.updateValue();
  }

  /**
   * Update the static/default color
   */
  onStaticColorChange(newColor: string): void {
    if (typeof this.value === "string") {
      this.value = newColor;
      this.onChange(newColor);
      return;
    }

    if (!Array.isArray(this.value)) {
      this.value = [{ condition: {}, color: newColor }];
    } else {
      // Update or add static mapping
      const staticIndex = this.value.findIndex(
        (m) => !Object.keys(m.condition || {}).length,
      );
      if (staticIndex >= 0) {
        this.value[staticIndex].color = newColor;
      } else {
        this.value.unshift({ condition: {}, color: newColor });
      }
    }

    this.onChange(this.value);
  }

  private updateValue(): void {
    this.onChange(this.value);
  }
}
