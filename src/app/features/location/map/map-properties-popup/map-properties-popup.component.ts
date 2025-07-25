import { Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../../core/common-components/dialog-close/dialog-close.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { EntityConstructor } from "../../../../core/entity/model/entity";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { getLocationProperties } from "../../map-utils";
import { MatButtonModule } from "@angular/material/button";

/**
 * A map of entity types and the (selected) location properties of this type
 */
export type LocationProperties = { [key: string]: string[] };

@Component({
  selector: "app-map-properties-popup",
  templateUrl: "./map-properties-popup.component.html",
  styles: [],
  imports: [
    MatDialogModule,
    DialogCloseComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
})
export class MapPropertiesPopupComponent {
  private dialogRef =
    inject<MatDialogRef<MapPropertiesPopupComponent>>(MatDialogRef);

  entityProperties: {
    entity: EntityConstructor;
    properties: { name: string; label: string }[];
    selected: string[];
  }[];

  constructor() {
    const mapProperties = inject<LocationProperties>(MAT_DIALOG_DATA);
    const entities = inject(EntityRegistry);

    this.entityProperties = Object.entries(mapProperties).map(
      ([entityType, selected]) => {
        const entity = entities.get(entityType);
        const mapProperties = getLocationProperties(entity);
        const properties = mapProperties.map((name) => ({
          name,
          label: entity.schema.get(name).label,
        }));
        return { entity, properties, selected };
      },
    );
  }

  closeDialog() {
    const result: LocationProperties = {};
    this.entityProperties.forEach(
      ({ entity, selected }) => (result[entity.ENTITY_TYPE] = selected),
    );
    this.dialogRef.close(result);
  }
}
