import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "../../core/basic-datatypes/string/long-text.datatype";
import { FileFieldConfig } from "../file/file.datatype";

/**
 * Represents a TemplateExport that can be used to generate PDFs via API,
 * replacing placeholders in the file with data from an entity.
 *
 * A TemplateExport entity represents the meta-data of a template and can be added and manage by admin users.
 */
@DatabaseEntity("TemplateExport")
export class TemplateExport extends Entity {
  static override label = $localize`:TemplateExport:Export Template`;
  static override labelPlural = $localize`:TemplateExport:Export Templates`;
  static override toStringAttributes = ["title"];
  static override route = "admin/template-export";

  /**
   * human-readable label
   */
  @DatabaseField({
    label: $localize`:TemplateExport:Title`,
    validators: { required: true },
  })
  title: string;

  /**
   * Additional description to guide users
   */
  @DatabaseField({
    label: $localize`:TemplateExport:Description`,
    dataType: LongTextDatatype.dataType,
  })
  description: string;

  /**
   * The entity type(s) this template can be used with (i.e. placeholders matching the entity type)
   */
  @DatabaseField({
    label: $localize`:TemplateExport:Applicable Entity Types`,
    labelShort: $localize`:TemplateExport:Entity Types`,
    editComponent: "EditEntityTypeDropdown",
    isArray: true,
  })
  applicableForEntityTypes: string[];

  /**
   * ID in the PDF Generator API to access this template
   */
  @DatabaseField({
    label: $localize`:TemplateExport:Template File`,
    description: $localize`:TemplateExport:Upload a specially prepared document that contains placeholders, which will be replace with actual data from a specific entity when generating a PDF.`,
    validators: { required: true },
    dataType: "template-export-file",
    additional: {
      acceptedFileTypes:
        ".docx, .doc, .odt, .xlsx, .xls, .ods, .pptx, .ppt, .odp",
    } as FileFieldConfig,
  })
  templateId: string;
  /**
   * The file name of the template file as uploaded by the user
   */
  templateFilename: string;

  /**
   * A string with the pattern including placeholders for the file name of the generated files,
   * e.g. "report_{d.name}_{d.dateOfBirth}.pdf"
   */
  targetFilename: string;
}
