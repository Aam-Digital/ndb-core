import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatchingEntitiesComponent } from "./matching-entities/matching-entities.component";
import { MatLegacyCardModule as MatCardModule } from "@angular/material/legacy-card";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { ViewModule } from "../../core/view/view.module";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { FilterModule } from "../../core/filter/filter.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityUtilsModule } from "../../core/entity-components/entity-utils/entity-utils.module";
import { LocationModule } from "../location/location.module";

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
    FilterModule,
    FontAwesomeModule,
    EntityUtilsModule,
    LocationModule,
  ],
  exports: [MatchingEntitiesComponent],
})
export class MatchingEntitiesModule {
  static dynamicComponents: [MatchingEntitiesComponent];
}
