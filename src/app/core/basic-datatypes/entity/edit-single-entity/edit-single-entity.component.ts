import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { Entity } from "../../../entity/model/entity";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { DisplayEntityComponent } from "../display-entity/display-entity.component";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgIf } from "@angular/common";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
import { LoggingService } from "../../../logging/logging.service";

@DynamicComponent("EditSingleEntity")
@Component({
  selector: "app-edit-single-entity",
  templateUrl: "./edit-single-entity.component.html",
  styleUrls: ["./edit-single-entity.component.scss"],
  imports: [
    BasicAutocompleteComponent,
    DisplayEntityComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    FontAwesomeModule,
    NgIf,
    ErrorHintComponent,
  ],
  standalone: true,
})
export class EditSingleEntityComponent
  extends EditComponent<string>
  implements OnInit
{
  entities: Entity[] = [];
  entityToId = (e: Entity) => e?.getId(true);

  constructor(
    private entityMapper: EntityMapperService,
    private logger: LoggingService,
  ) {
    super();
  }

  async ngOnInit() {
    super.ngOnInit();
    const availableEntities = await this.entityMapper.loadType(this.additional);
    const selected = this.formControl.value;
    if (
      selected &&
      !availableEntities.some(
        (e) => e.getId(true) === selected || e.getId() === selected,
      )
    ) {
      try {
        const type = Entity.extractTypeFromId(selected);
        const entity = await this.entityMapper.load(type, selected);
        availableEntities.push(entity);
      } catch (e) {
        this.logger.warn(
          `[EDIT_SINGLE_ENTITY] Could not find entity with ID: ${selected}: ${e}`,
        );
      }
    }
    this.entities = availableEntities.sort((e1, e2) =>
      e1.toString().localeCompare(e2.toString()),
    );
  }
}
