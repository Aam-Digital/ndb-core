import { AfterViewChecked, Component, ViewChild } from "@angular/core";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatDialogClose } from "@angular/material/dialog";

@Component({
  selector: "app-dialog-close",
  templateUrl: "./dialog-close.component.html",
  styleUrls: ["./dialog-close.component.scss"],
  imports: [FontAwesomeModule, MatButtonModule, MatDialogClose],
})
export class DialogCloseComponent implements AfterViewChecked {
  @ViewChild("button") button: MatButton;

  ngAfterViewChecked() {
    (<HTMLButtonElement>this.button._elementRef.nativeElement).blur();
  }
}
