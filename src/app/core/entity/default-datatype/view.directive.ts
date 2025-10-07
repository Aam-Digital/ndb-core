import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { Entity } from "../model/entity";
import { Directive, Input, OnChanges, SimpleChanges } from "@angular/core";

@Directive()
export abstract class ViewDirective<T, C = any> implements OnChanges {
  @Input() entity: Entity;
  @Input() id: string;
  @Input() tooltip: string;
  @Input() value: T;

  @Input() set formFieldConfig(value: FormFieldConfig) {
    this._formFieldConfig = value;
    this.config = value?.additional as C;
  }
  get formFieldConfig(): FormFieldConfig {
    return this._formFieldConfig;
  }
  private _formFieldConfig: FormFieldConfig;
  
  /**
   * The "additional" context config of the field.
   */
  @Input() config: C;

  /** indicating that the value is not in its original state, so that components can explain this to the user */
  isPartiallyAnonymized: boolean;

  /**
   * Attention:
   * When content is loaded async in your child component, you need to manually trigger the change detection
   * See: https://angularindepth.com/posts/1054/here-is-what-you-need-to-know-about-dynamic-components-in-angular#ngonchanges
   *
   */
  ngOnChanges(changes?: SimpleChanges) {
    this.isPartiallyAnonymized =
      this.entity?.anonymized &&
      this.entity?.getSchema()?.get(this.id)?.anonymize === "retain-anonymized";
  }
}
