import { Component, Inject } from "@angular/core";
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from "@angular/material/bottom-sheet";

@Component({
  selector: "app-install-app-prompt",
  templateUrl: "./install-app-prompt.component.html",
  styleUrls: ["./install-app-prompt.component.scss"],
})
export class InstallAppPromptComponent {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: { mobileType: "ios" | "android"; promptEvent?: any },
    private bottomSheetRef: MatBottomSheetRef<InstallAppPromptComponent>
  ) {}

  public installPwa(): void {
    this.data.promptEvent.prompt();
    this.close();
  }
  public close() {
    this.bottomSheetRef.dismiss();
  }
}
