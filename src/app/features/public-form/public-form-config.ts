import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { FieldGroup } from "app/core/entity-details/form/field-group";

@DatabaseEntity("PublicFormConfig")
export class PublicFormConfig extends Entity {
  @DatabaseField() title: string;
  @DatabaseField() description: string;
  @DatabaseField() entity: string;
  @DatabaseField() columns: FieldGroup;
}
