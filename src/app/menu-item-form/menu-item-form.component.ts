import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MenuItem } from "../core/ui/navigation/menu-item";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { AdminIconComponent } from "../admin-icon-input/admin-icon-input.component";

@Component({
  selector: "app-menu-item-form",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    AdminIconComponent,
  ],
  templateUrl: "./menu-item-form.component.html",
  styleUrls: ["./menu-item-form.component.scss"],
})
export class MenuItemFormComponent {
  @Input() item!: MenuItem;
  @Output() itemChange = new EventEmitter<MenuItem>();

  onChange() {
    this.itemChange.emit({ ...this.item });
  }
}
