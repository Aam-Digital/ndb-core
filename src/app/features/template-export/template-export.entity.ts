import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "../../core/basic-datatypes/string/long-text.datatype";
import { FileFieldConfig } from "../file/file.datatype";
import { EntityBlockConfig } from "../../core/basic-datatypes/entity/entity-block/entity-block-config";
import { TemplateExportFileDatatype } from "./template-export-file-datatype/template-export-file.datatype";

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
  static override toBlockDetailsAttributes: EntityBlockConfig = {
    title: "title",
    fields: ["description"],
  };
  static override route = "admin/template-export";
  static override isInternalEntity = true;

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
    label: $localize`:TemplateExport:Applicable Record Types`,
    labelShort: $localize`:TemplateExport:Record Types`,
    editComponent: "EditEntityType",
    viewComponent: "DisplayEntityType",
    isArray: true,
    validators: { required: true },
  })
  applicableForEntityTypes: string[];

  /**
   * Whether this template expects data of all selected records combined into a single
   * top-level array (`d` becomes an array in the template, to be used with carbone's
   * array/repetition syntax), instead of being applied to one record at a time.
   *
   * Such a report only makes sense for multiple records at once, so it is only offered
   * as an option when generating a file for a bulk selection, never for a single record.
   */
  @DatabaseField({
    label: $localize`:TemplateExport:Multi-Record Report`,
    description: $localize`:TemplateExport:Enable this if the template uses carbone's array syntax to list all selected records within a single generated document (e.g. a table listing multiple people), instead of generating one file per record. Only offered when generating a file for multiple selected records at once (not for a single record).`,
    dataType: "boolean",
  })
  arrayReport?: boolean;

  /**
   * File (storing the file name) of the template uploaded to the server.
   */
  @DatabaseField({
    label: $localize`:TemplateExport:Template File`,
    description: $localize`:TemplateExport:Upload a specially prepared document that contains placeholders, which will be replace with actual data from a specific record when generating a PDF.`,
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
    label: $localize`:TemplateExport:File name pattern for generated file`,
    labelShort: $localize`:TemplateExport:File name pattern`,
    description: $localize`:TemplateExport:The filename for the resulting file when using this template. You can use the same placeholders here as in the template file itself (e.g. "my-report_{d.name}_{c.user.name}.pdf").`,
    validators: { required: true },
  })
  targetFileName: string;
}
