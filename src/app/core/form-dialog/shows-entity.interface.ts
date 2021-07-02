import { FormDialogWrapperComponent } from "./form-dialog-wrapper/form-dialog-wrapper.component";
import { Entity } from "../entity/model/entity";

/**
 * Interface to be implemented by Components so that they can be used with {@link FormDialogService}.
 *
 * see {@link FormDialogService} for details
 */
export interface ShowsEntity<T extends Entity> {
  /**
   * Input for the Entity that is being displayed/edited
   */
  entity: T;

  /**
   * reference to the FormDialogWrapperComponent used in the template.
   *
   * This is used to access certain generic hooks of the form logic.
   */
  formDialogWrapper: FormDialogWrapperComponent;
}
