import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "#src/app/core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Represents the result from the JSON editor dialog.
 * @property  originalData The original value before editing.
 * @property  updatedData The value after editing.
 */
export interface JsonEditResult<T> {
  originalData: T;
  updatedData: T;
}

@Injectable({
  providedIn: "root",
})
export class JsonEditorService {
  private readonly dialog = inject(MatDialog);

  openJsonEditorDialog<T = any>(data: T): Observable<JsonEditResult<T>> {
    // deep copy to avoid modifying the original schema
    const originalData = JSON.parse(JSON.stringify(data));

    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: {
        value: data,
        closeButton: true,
      },
    });

    return dialogRef
      .afterClosed()
      .pipe(map((updatedData) => ({ originalData, updatedData })));
  }
}
