import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { Entity } from "app/core/entity/model/entity";
import { HintBoxComponent } from "app/core/common-components/hint-box/hint-box.component";
import { PublicFormConfig } from "../public-form-config";

/**
 * Warn admins that a public form is stored in the multi form format,
 * which the fields of this admin view cannot represent.
 *
 * The form keeps working for the people filling it in, only its configuration
 * has to be changed elsewhere until the admin UI supports the format.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-public-form-format-warning",
  templateUrl: "./public-form-format-warning.component.html",
  imports: [HintBoxComponent],
})
export class PublicFormFormatWarningComponent {
  /** the entity being edited (PublicFormConfig) */
  entity = input<Entity>();

  readonly isMultiFormConfig = computed(
    () => !!(this.entity() as PublicFormConfig | undefined)?.forms?.length,
  );
}
