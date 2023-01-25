import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../../core/common-components/dialog-close/dialog-close.component";
import { MatchingSide } from "../matching-entities.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { NgForOf, NgIf } from "@angular/common";
import { EntityConstructor } from "../../../../core/entity/model/entity";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";

@Component({
  selector: "app-map-properties-popup",
  templateUrl: "./map-properties-popup.component.html",
  styles: [],
  imports: [
    MatDialogModule,
    DialogCloseComponent,
    MatFormFieldModule,
    MatSelectModule,
    NgForOf,
    NgIf,
  ],
  standalone: true,
})
export class MapPropertiesPopupComponent {
  entityProperties: {
    entity: EntityConstructor;
    properties: { name: string; label: string }[];
    selected: string[];
  }[];

  constructor(
    @Inject(MAT_DIALOG_DATA) mapProperties: { [key in string]: string[] },
    entities: EntityRegistry
  ) {
    this.entityProperties = Object.entries(mapProperties).map(
      ([entityType, selected]) => {
        const entity = entities.get(entityType);
        const properties = selected.map((name) => ({
          name,
          label: entity.schema.get(name).label,
        }));
        // TODO selection is not remembered
        return { entity, properties, selected };
      }
    );
  }
}
