import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ComingSoonComponent } from "./coming-soon/coming-soon.component";

/**
 * Show a popup dialog with the {@link ComingSoonComponent}
 * explaining that the requested feature is not available yet and integrating with usage analytics to track requests.
 */
@Injectable({
  providedIn: "root",
})
export class ComingSoonDialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Open dialog with the coming soon page.
   * @param featureId identifier to track requests for the given feature in usage analytics
   */
  open(featureId: string) {
    this.dialog.open(ComingSoonComponent, { data: { featureId: featureId } });
  }
}
