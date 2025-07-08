import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "#src/app/core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class JsonEditorService {
  private readonly dialog = inject(MatDialog);

  /**
   * Open a dialog with a JSON editor to edit the given data.
   * Does not modify the original data but returns a new updated value.
   * @param data
   */
  openJsonEditorDialog<T = any>(data: T): Observable<T> {
    // deep copy to avoid modifying the original schema
    const dataCopy = JSON.parse(JSON.stringify(data));

    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: {
        value: dataCopy,
        closeButton: true,
      },
    });

    return dialogRef.afterClosed();
  }
}
