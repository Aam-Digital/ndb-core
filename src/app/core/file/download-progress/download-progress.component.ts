import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Observable } from "rxjs";

@Component({
  selector: "app-download-progress",
  templateUrl: "./download-progress.component.html",
  styleUrls: ["./download-progress.component.scss"],
})
export class DownloadProgressComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { progress: Observable<number> }
  ) {}
}
