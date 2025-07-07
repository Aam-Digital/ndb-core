import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "#src/app/core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class JsonEditorService {
  private readonly dialog = inject(MatDialog);

  openJsonEditorDialog<T = any>(data: T): Observable<T> {
    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: {
        value: data,
        closeButton: true,
      },
    });

    return dialogRef.afterClosed();
  }
}
