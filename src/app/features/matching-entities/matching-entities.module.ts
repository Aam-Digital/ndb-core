import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { MatButtonModule } from "@angular/material/button";
import { ViewModule } from "../../core/view/view.module";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FilterModule } from "../../core/filter/filter.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityUtilsModule } from "../../core/entity-components/entity-utils/entity-utils.module";
import { LocationModule } from "../location/location.module";

/**
 * Facilitate finding suitable entities and connecting them.
 */
@NgModule({
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
})
export class MatchingEntitiesModule {}
