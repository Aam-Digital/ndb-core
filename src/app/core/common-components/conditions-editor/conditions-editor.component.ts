import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "../basic-autocomplete/custom-form-control.directive";
import { JsonEditorDialogComponent } from "../../admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { DataFilter } from "../../filter/filters/filters";

/**
 * A CustomFormControl component for editing DataFilter conditions using a JSON editor.
 *
 * This component provides a button that opens a JSON editor dialog where users can
 * define filter conditions. It can be used in reactive forms like any other form control.
 *
 * Example usage:
 * ```html
 * <mat-form-field>
 *   <mat-label>Conditions</mat-label>
 *   <app-conditions-editor formControlName="conditions"></app-conditions-editor>
 * </mat-form-field>
 * ```
 */
@Component({
  selector: "app-conditions-editor",
  templateUrl: "./conditions-editor.component.html",
  styleUrl: "./conditions-editor.component.scss",
  imports: [MatButtonModule],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: ConditionsEditorComponent,
    },
  ],
})
export class ConditionsEditorComponent extends CustomFormControlDirective<
  DataFilter<any>
> {
  private dialog = inject(MatDialog);

  /**
   * Open the JSON editor dialog to edit the conditions.
   */
  openConditionsEditor() {
    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: {
        value: this.value ?? {},
        closeButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.value = result;
      }
    });
  }

}
