import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DashboardShortcutWidgetComponent } from "./dashboard-shortcut-widget/dashboard-shortcut-widget.component";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { Angulartics2Module } from "angulartics2";
import { DashboardModule } from "../dashboard/dashboard.module";
import { ViewModule } from "../view/view.module";
import { MatDividerModule } from "@angular/material/divider";

@NgModule({
  declarations: [DashboardShortcutWidgetComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
    Angulartics2Module,
    DashboardModule,
    ViewModule,
    MatDividerModule,
  ],
  exports: [DashboardShortcutWidgetComponent],
})
export class DashboardShortcutWidgetModule {}
