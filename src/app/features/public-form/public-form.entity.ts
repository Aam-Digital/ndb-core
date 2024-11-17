import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "../../core/basic-datatypes/string/long-text.datatype";
import { FileFieldConfig } from "../file/file.datatype";
import { EntityBlockConfig } from "../../core/basic-datatypes/entity/entity-block/entity-block-config";
import { TemplateExportFileDatatype } from "../template-export/template-export-file-datatype/template-export-file.datatype";

/**
 * Represents a PublicForm that can be used to generate PDFs via API,
 * replacing placeholders in the file with data from an entity.
 *
 * A PublicForm entity represents the meta-data of a template and can be added and manage by admin users.
 */
@DatabaseEntity("PublicForm")
export class PublicForm extends Entity {
  static override label = $localize`:PublicForm:Public Forms`;
  static override labelPlural = $localize`:PublicForm:Public Forms`;
  static override toStringAttributes = ["title"];
  static override toBlockDetailsAttributes: EntityBlockConfig = {
    title: "title",
    fields: ["description"],
  };
  static override route = "admin/public-form";

  /**
   * human-readable label
   */
  @DatabaseField({
    label: $localize`:PublicForm:Title`,
    validators: { required: true },
  })
  title: string;

  /**
   * Additional description to guide users
   */
  @DatabaseField({
    label: $localize`:PublicForm:Description`,
    dataType: LongTextDatatype.dataType,
  })
  description: string;

  /**
   * The entity type(s) this template can be used with (i.e. placeholders matching the entity type)
   */
  @DatabaseField({
    label: $localize`:PublicForm:Applicable Entity Types`,
    labelShort: $localize`:PublicForm:Entity Types`,
    editComponent: "EditEntityTypeDropdown",
    isArray: true,
  })
  applicableForEntityTypes: string[];

  /**
   * File (storing the file name) of the template uploaded to the server.
   */
  @DatabaseField({
    label: $localize`:PublicForm:Template File`,
    description: $localize`:PublicForm:Upload a specially prepared document that contains placeholders, which will be replace with actual data from a specific entity when generating a PDF.`,
    validators: { required: true },
    dataType: TemplateExportFileDatatype.dataType,
    additional: {
      acceptedFileTypes:
        ".docx, .doc, .odt, .xlsx, .xls, .ods, .pptx, .ppt, .odp",
    } as FileFieldConfig,
  })
  templateFile: string;

  /**
   * ID of the template file in the server-side managed API.
   *
   * This is not displayed to users - they interact with the templateFile property instead
   * while this templateId is automatically set when the file is uploaded.
   */
  @DatabaseField()
  templateId: string;

  /**
   * A string with the pattern including placeholders for the file name of the generated files.
   */
  @DatabaseField({
    label: $localize`:PublicForm:File name pattern for generated file`,
    labelShort: $localize`:PublicForm:File name pattern`,
    description: $localize`:PublicForm:The filename for the resulting file when using this template. You can use the same placeholders here as in the template file itself (e.g. "my-report_{d.name}.pdf").`,
    validators: { required: true },
  })
  targetFileName: string;
}
