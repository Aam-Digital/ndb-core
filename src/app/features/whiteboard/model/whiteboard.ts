import { IconName } from "@fortawesome/fontawesome-svg-core";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { WhiteboardItem } from "./whiteboard-item";

/**
 * A free-form canvas on which users arrange cards of records and their own annotations.
 *
 * See the feature README for the UX and the item model.
 */
@DatabaseEntity("Whiteboard")
export class Whiteboard extends Entity {
  static override label = $localize`:label for entity:Whiteboard`;
  static override labelPlural = $localize`:label (plural) for entity:Whiteboards`;
  static override icon: IconName = "chalkboard";
  static override toStringAttributes = ["title"];
  static override hasPII = true;

  static create(properties: Partial<Whiteboard>): Whiteboard {
    const instance = new Whiteboard();
    Object.assign(instance, properties);
    return instance;
  }

  @DatabaseField({
    label: $localize`:Label:Title`,
    validators: { required: true },
  })
  title: string = "";

  /**
   * The cards, annotations and connections placed on the board.
   * Managed by the board view only, therefore not offered as a form field (no label).
   */
  @DatabaseField({ isArray: true })
  items: WhiteboardItem[] = [];
}
