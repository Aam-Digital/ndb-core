import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { DatabaseField } from "app/core/entity/database-field.decorator";
import { Entity } from "app/core/entity/model/entity";

//* MarkdownContent entity to store markdown content
@DatabaseEntity("MarkdownContent")
export class MarkdownContent extends Entity {
  // The content/details of the markdown entity
  @DatabaseField() content: string;
}
