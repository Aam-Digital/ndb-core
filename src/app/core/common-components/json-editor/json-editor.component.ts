import { Component, inject, Input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "../basic-autocomplete/custom-form-control.directive";
import { JsonEditorDialogComponent } from "../../admin/json-editor/json-editor-dialog/json-editor-dialog.component";

/**
 * A CustomFormControl component for editing JSON data using a JSON editor dialog.
 *
 * This component provides a button that opens a JSON editor dialog where users can
 * edit any JSON structure. It can be used in reactive forms like any other form control.
 *
 * Example usage:
 * ```html
 * <mat-form-field>
 *   <mat-label>Configuration</mat-label>
 *   <app-json-editor formControlName="config" buttonLabel="Edit JSON"></app-json-editor>
 * </mat-form-field>
 * ```
 */
@Component({
  selector: "app-json-editor",
  templateUrl: "./json-editor.component.html",
  styleUrl: "./json-editor.component.scss",
  imports: [MatButtonModule, MatTooltipModule, FontAwesomeModule],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: JsonEditorComponent,
    },
  ],
})
export class JsonEditorComponent extends CustomFormControlDirective<any> {
  private readonly dialog = inject(MatDialog);

  /** Label for the button that opens the editor */
  @Input() buttonLabel: string = $localize`Open Editor`;

  /** Tooltip for the button */
  @Input() buttonTooltip: string = "";

  /** Icon for the button (optional) */
  @Input() buttonIcon: string = "code";

  /** Whether to show the button as icon button instead of stroked button */
  @Input() iconButton: boolean = false;

  /** Initial value to use when the current value is undefined/null */
  @Input() initialValue: any = {};

  /**
   * Open the JSON editor dialog to edit the value.
   */
  openJsonEditor() {
    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: {
        value: this.value ?? this.initialValue,
        closeButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.value = result;
        this.onChange(result);
      }
    });
  }
}
