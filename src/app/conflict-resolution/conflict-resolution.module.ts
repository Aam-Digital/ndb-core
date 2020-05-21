import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConflictResolutionComponent } from "./conflict-resolution/conflict-resolution.component";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatExpansionModule } from "@angular/material/expansion";
import { CompareRevComponent } from "./compare-rev/compare-rev.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ConflictResolutionRoutingModule } from "./conflict-resolution-routing.module";

/**
 * Display and resolve document conflicts in the database through a simple user interface for administrators.
 */
@NgModule({
  imports: [
    ConflictResolutionRoutingModule,
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatExpansionModule,
    FlexLayoutModule,
    MatInputModule,
    FormsModule,
    MatTooltipModule,
  ],
  declarations: [ConflictResolutionComponent, CompareRevComponent],
})
export class ConflictResolutionModule {}
