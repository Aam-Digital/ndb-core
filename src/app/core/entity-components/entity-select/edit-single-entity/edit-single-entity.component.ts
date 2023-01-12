import { Component } from "@angular/core";
import {
  EditComponent,
  EditPropertyConfig,
} from "../../entity-utils/dynamic-form-components/edit-component";
import { Entity } from "../../../entity/model/entity";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { DisplayEntityComponent } from "../display-entity/display-entity.component";
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { BasicAutocompleteComponent } from "../../../configurable-enum/basic-autocomplete/basic-autocomplete.component";

@DynamicComponent("EditSingleEntity")
@Component({
  selector: "app-edit-single-entity",
  templateUrl: "./edit-single-entity.component.html",
  styleUrls: ["./edit-single-entity.component.scss"],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    DisplayEntityComponent,
    NgIf,
    MatAutocompleteModule,
    MatButtonModule,
    FontAwesomeModule,
    AsyncPipe,
    NgForOf,
    BasicAutocompleteComponent,
  ],
  standalone: true,
})
export class EditSingleEntityComponent extends EditComponent<string> {
  entities: Entity[] = [];
  entityToId = (e: Entity) => e?.getId();

  constructor(private entityMapperService: EntityMapperService) {
    super();
  }

  async onInitFromDynamicConfig(config: EditPropertyConfig<string>) {
    super.onInitFromDynamicConfig(config);
    const entityType: string =
      config.formFieldConfig.additional || config.propertySchema.additional;
    this.entities = await this.entityMapperService.loadType(entityType);
    this.entities.sort((e1, e2) => e1.toString().localeCompare(e2.toString()));
  }
}
