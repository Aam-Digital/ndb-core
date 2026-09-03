import { TranslatableText } from "app/core/config/multi-lingual-config";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { DatabaseField } from "app/core/entity/database-field.decorator";
import { Entity } from "app/core/entity/model/entity";

/**
 * Some Markdown formatted text to be displayed in a view.
 */
@DatabaseEntity("MarkdownContent")
export class MarkdownContent extends Entity {
  /** markdown content, may hold a per-language map (#3862) */
  @DatabaseField() content: TranslatableText;
}
