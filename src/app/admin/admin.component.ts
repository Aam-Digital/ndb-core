import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { MenuItem } from "app/core/ui/navigation/menu-item";
import { MenuItemComponent } from "app/core/ui/navigation/menu-item/menu-item.component";

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [CommonModule, MatListModule, MenuItemComponent],
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.scss"],
})
export class AdminComponent {
  @Input() menuItems: MenuItem[];
  //@Output() menuItemsChange = new EventEmitter<MenuItem[]>();
}
