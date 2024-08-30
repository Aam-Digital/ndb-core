import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "../../core/basic-datatypes/string/long-text.datatype";

/**
 * Represents a file template that can be used to generate PDFs via API,
 * replacing placeholders in the file with data from an entity.
 *
 * A FileTemplate entity represents the meta-data of a template and can be added and manage by admin users.
 */
@DatabaseEntity("FileTemplate")
export class FileTemplate extends Entity {
  static override label = $localize`:File Template:File Template`;
  static override labelPlural = $localize`:File Template:File Templates`;
  static override toStringAttributes = ["title"];
  static override route = "admin/file-template";

  /**
   * human-readable label
   */
  @DatabaseField({
    label: $localize`:File Template:Title`,
  })
  title: string;

  /**
   * Additional description to guide users
   */
  @DatabaseField({
    label: $localize`:File Template:Description`,
    dataType: LongTextDatatype.dataType,
  })
  description: string;

  /**
   * The entity type(s) this template can be used with (i.e. placeholders matching the entity type)
   */
  @DatabaseField({
    label: $localize`:File Template:Applicable Entity Types`,
    labelShort: $localize`:File Template:Entity Types`,
  })
  // TODO: create custom datatype or "dynamic" enum for all entity types (see AdminEntityFieldComponent, ImportEntityTypeComponent, etc.)
  applicableForEntityTypes: string[];

  /**
   * ID in the PDF Generator API to access this template
   */
  @DatabaseField({
    label: $localize`:File Template:Template ID`,
  })
  // TODO: component to upload a template file to the API and get the ID
  templateId: string;
}
