import {
  Component,
  inject,
  Input,
  OnInit,
  Output,
  EventEmitter,
} from "@angular/core";
import {
  MatFormFieldModule,
  MatFormFieldControl,
} from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialog } from "@angular/material/dialog";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { ColorMapping, EntityConstructor } from "app/core/entity/model/entity";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { ColorInputComponent } from "app/color-input/color-input.component";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { JsonEditorDialogComponent } from "app/core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";
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
    MatSelectModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule,
    ColorInputComponent,
    ConditionalColorSectionComponent,
  ],
})
export class ConditionalColorConfigComponent
  extends CustomFormControlDirective<string | ColorMapping[]>
  implements OnInit
{
  @Input() entityConstructor: EntityConstructor;
  @Input() isConditionalMode: boolean = false;
  @Output() isConditionalModeChange = new EventEmitter<boolean>();

  private readonly dialog = inject(MatDialog);

  colorFieldOptions: SimpleDropdownValue[] = [];
  conditionFormFieldConfigs = new Map<string, FormFieldConfig>();
  conditionFormControls = new Map<string, FormControl>();

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

  addConditionalMode(): void {
    this.isConditionalModeChange.emit(true);
    if (this.conditionalColorSections.length === 0) {
      this.addConditionalColorSection();
    }
  }

  removeConditionalMode(): void {
    this.isConditionalModeChange.emit(false);
    this.conditionFormFieldConfigs.clear();
    this.conditionFormControls.clear();

    // Remove all conditional sections and keep only the static color
    if (Array.isArray(this.value)) {
      const currentStaticColor = this.staticColor;
      this.value = currentStaticColor;
      this.onChange(this.value);
    }
  }

  /**
   * Add a new conditional color section
   */
  addConditionalColorSection(): void {
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

  ngOnInit(): void {
    this.colorFieldOptions = Array.from(this.entityConstructor.schema.entries())
      .filter(([_, field]) => field.label)
      .map(([key, field]) => ({ value: key, label: field.label }));
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

  /**
   * Open full JSON editor for all conditional mappings
   */
  openFullJsonEditor(): void {
    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: { value: this.conditionalColorSections, closeButton: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined && Array.isArray(this.value)) {
        const staticMapping = this.value.find(
          (m) => !Object.keys(m.condition || {}).length,
        );
        this.value = staticMapping ? [staticMapping, ...result] : result;
        this.onChange(this.value);
      }
    });
  }
}
