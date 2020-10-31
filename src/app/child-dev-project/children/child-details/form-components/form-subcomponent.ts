import { OnChanges, SimpleChanges } from "@angular/core";
import { Child } from "../../model/child";
import { AbstractControlOptions, FormBuilder, FormGroup } from "@angular/forms";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { AlertService } from "../../../../core/alerts/alert.service";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";

export abstract class FormSubcomponent
  implements OnChanges, OnInitDynamicComponent {
  child: Child = new Child("");
  editing: boolean = false;
  form: FormGroup;
  validateForm: boolean = false;
  config;

  public constructor(
    private entityMapperService: EntityMapperService,
    private fb: FormBuilder,
    private alertService: AlertService
  ) {
    this.initForm(this.getFormConfig());
  }

  protected abstract getFormConfig(): {
    controlsConfig: { [key: string]: any };
    options?: AbstractControlOptions | { [key: string]: any } | null;
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("child")) {
      this.initForm(this.getFormConfig());
    }
  }

  onInitFromDynamicConfig(config: any) {
    this.child = config.child;
    this.initForm(this.getFormConfig());
    this.config = config.config;
    console.log("config", config);
  }

  switchEdit() {
    this.editing = !this.editing;
    this.initForm(this.getFormConfig());
  }

  async save(): Promise<any> {
    // errors regarding invalid fields wont be displayed unless marked as touched
    this.form.markAllAsTouched();
    this.validateForm = true;
    if (this.form.valid) {
      this.assignFormValuesToChild(this.child, this.form);
      try {
        await this.entityMapperService.save<Child>(this.child);
        this.alertService.addInfo("Saving Successful");
        this.switchEdit();
        return this.child;
      } catch (err) {
        this.alertService.addDanger(
          'Could not save Child "' + this.child.name + '": ' + err
        );
        throw new Error(err);
      }
    } else {
      const invalidFields = this.getInvalidFields();
      this.alertService.addDanger(
        "Form invalid, required fields (" + invalidFields + ") missing"
      );
      throw new Error(
        "Form invalid, required fields(" + invalidFields + ") missing"
      );
    }
  }

  private assignFormValuesToChild(child: Child, form: FormGroup) {
    Object.keys(form.controls).forEach((key) => {
      const value = form.get(key).value;
      if (value !== null) {
        child[key] = value;
      }
    });
  }

  private getInvalidFields() {
    const invalid = [];
    const controls = this.form.controls;
    for (const field in controls) {
      if (controls[field].invalid) {
        invalid.push(field);
      }
    }
    return invalid;
  }

  private initForm(config: {
    controlsConfig: { [key: string]: any };
    options?: AbstractControlOptions | { [key: string]: any } | null;
  }): void {
    this.form = this.fb.group(config.controlsConfig, config.options);
  }
}
