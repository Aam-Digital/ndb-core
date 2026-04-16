import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { ConfigurableEnumCleanupComponent } from "#src/app/core/admin/config-cleanup/configurable-enum-cleanup.component";

@Component({
  selector: "app-admin-config-cleanup",
  templateUrl: "./admin-config-cleanup.component.html",
  styleUrl: "./admin-config-cleanup.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ViewTitleComponent,
    MatExpansionModule,
    ConfigurableEnumCleanupComponent,
  ],
})
export class AdminConfigCleanupComponent {}
