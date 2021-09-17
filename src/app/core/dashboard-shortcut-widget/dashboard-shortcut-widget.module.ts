import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DashboardShortcutWidgetComponent } from "./dashboard-shortcut-widget/dashboard-shortcut-widget.component";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@NgModule({
  declarations: [DashboardShortcutWidgetComponent],
    imports: [CommonModule, MatCardModule, MatIconModule, RouterModule, FontAwesomeModule],
  exports: [DashboardShortcutWidgetComponent],
})
export class DashboardShortcutWidgetModule {}
