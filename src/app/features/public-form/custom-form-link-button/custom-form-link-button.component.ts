import { Component, Input, OnInit, inject } from "@angular/core";
import { PublicFormConfig } from "app/features/public-form/public-form-config";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { PublicFormsService } from "../public-forms.service";

@Component({
  selector: "app-custom-form-link-button",
  templateUrl: "./custom-form-link-button.component.html",
  standalone: true,
  imports: [MatButtonModule, MatTooltipModule, FontAwesomeModule],
})
export class CustomFormLinkButtonComponent implements OnInit {
  private entityMapper = inject(EntityMapperService);
  private publicFormsService = inject(PublicFormsService);

  /**
   * The entity instance that this form is associated with.
   * For example, a Child record when linking a feedback form to a specific child.
   */
  @Input() linkedEntity: Entity;

  /**
   * The constructor of the entity type that the form submission will create.
   * This is typically different from the linkedEntity type.
   * For example, a FeedbackSubmission entity linked to a Child.
   */
  @Input() formEntityType: EntityConstructor;

  public matchingCustomForms: PublicFormConfig[] = [];

  async ngOnInit() {
    if (!this.linkedEntity || !this.formEntityType) return;

    const allForms = await this.entityMapper.loadType(PublicFormConfig);
    const matchingForms = allForms.filter((config) =>
      this.publicFormsService.hasLinkedEntities(config),
    );

    this.matchingCustomForms = [];

    for (const config of matchingForms) {
      const matchesCustomForm =
        await this.publicFormsService.isEntityTypeLinkedToConfig(
          config,
          this.linkedEntity,
        );
      const matchesEntityType = this.isMatchingFormEntityType(config);

      if (matchesCustomForm && matchesEntityType) {
        this.matchingCustomForms.push(config);
      }
    }
  }

  async copyLink(matchingCustomForm: PublicFormConfig) {
    if (!matchingCustomForm) return;
    await this.publicFormsService.copyPublicFormLinkFromConfig(
      matchingCustomForm,
      this.linkedEntity,
    );
  }

  private isMatchingFormEntityType(config: PublicFormConfig): boolean {
    if (config.forms?.length) {
      return config.forms.some(
        (form) => form.entity === this.formEntityType.ENTITY_TYPE,
      );
    }

    return config.entity === this.formEntityType.ENTITY_TYPE;
  }
}
