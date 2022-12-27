import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConflictResolutionListComponent } from "./conflict-resolution-list/conflict-resolution-list.component";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { MatSortModule } from "@angular/material/sort";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyPaginatorModule as MatPaginatorModule } from "@angular/material/legacy-paginator";
import { MatExpansionModule } from "@angular/material/expansion";
import { CompareRevComponent } from "./compare-rev/compare-rev.component";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { FormsModule } from "@angular/forms";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { ConflictResolutionRoutingModule } from "./conflict-resolution-routing.module";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";

/**
 * Display and resolve document conflicts in the database through a simple user interface for administrators.
 *
 * You can register additional custom strategies to auto-resolve conflicts
 * by implementing {@link ConflictResolutionStrategy}
 * and registering your implementation as a provider in your Module:
 * `{ provide: CONFLICT_RESOLUTION_STRATEGY, useClass: MyConflictResolutionStrategy, multi: true }`
 *
 * Import this as a "lazy-loaded" module in your main routing:
 * @example
routes: Routes = [
  {
    path: "admin/conflicts",
    canActivate: [AdminGuard],
    loadChildren: () =>
      import("./conflict-resolution/conflict-resolution.module").then(
        (m) => m.ConflictResolutionModule
      ),
  }
];
 */
@NgModule({
  imports: [
    ConflictResolutionRoutingModule,
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatInputModule,
    FormsModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  declarations: [ConflictResolutionListComponent, CompareRevComponent],
})
export class ConflictResolutionModule {
  static dynamicComponents = [ConflictResolutionListComponent];
}
