import { AfterViewChecked, Component, ViewChild } from "@angular/core";
import { MatLegacyButton as MatButton } from "@angular/material/legacy-button";

@Component({
  selector: "app-dialog-close",
  templateUrl: "./dialog-close.component.html",
  styleUrls: ["./dialog-close.component.scss"],
})
export class DialogCloseComponent implements AfterViewChecked {
  @ViewChild("button") button: MatButton;

  ngAfterViewChecked() {
    (<HTMLButtonElement>this.button._elementRef.nativeElement).blur();
  }
}
