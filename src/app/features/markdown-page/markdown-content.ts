import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { DatabaseField } from "app/core/entity/database-field.decorator";
import { Entity } from "app/core/entity/model/entity";

/**
 * Some Markdown formatted text to be displayed in a view.
 */
@DatabaseEntity("MarkdownContent")
export class MarkdownContent extends Entity {
  /**
   * The content with markdown formatting.
   */
  @DatabaseField() content: string;
}
