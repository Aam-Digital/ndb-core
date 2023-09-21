import { Component, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { AuthUser } from "../../auth/auth-user";
import { MatRadioModule } from "@angular/material/radio";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-user-select",
  standalone: true,
  imports: [
    CommonModule,
    MatRadioModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: "./user-select.component.html",
  styleUrls: ["./user-select.component.scss"],
})
export class UserSelectComponent {
  selected = this.users[0];
  constructor(@Inject(MAT_DIALOG_DATA) public users: AuthUser[]) {}
}
