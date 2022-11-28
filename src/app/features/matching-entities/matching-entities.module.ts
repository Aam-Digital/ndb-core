import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatchingEntitiesComponent } from "./matching-entities/matching-entities.component";
import { MatCardModule } from "@angular/material/card";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { MatButtonModule } from "@angular/material/button";
import { ViewModule } from "../../core/view/view.module";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * Facilitate finding suitable entities and connecting them.
 */
@NgModule({
  declarations: [MatchingEntitiesComponent],
  imports: [
    CommonModule,
    MatCardModule,
    EntitySubrecordModule,
    MatButtonModule,
    ViewModule,
    MatTableModule,
    MatTooltipModule,
  ],
  exports: [MatchingEntitiesComponent],
})
export class MatchingEntitiesModule {
  static dynamicComponents: [MatchingEntitiesComponent];
}
