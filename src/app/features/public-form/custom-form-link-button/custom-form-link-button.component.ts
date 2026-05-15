import {
  Component,
  input,
  resource,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { PublicFormConfig } from "app/features/public-form/public-form-config";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { PublicFormsService } from "../public-forms.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-custom-form-link-button",
  templateUrl: "./custom-form-link-button.component.html",
  standalone: true,
  imports: [MatButtonModule, MatTooltipModule, FontAwesomeModule],
})
export class CustomFormLinkButtonComponent {
  private entityMapper = inject(EntityMapperService);
  private publicFormsService = inject(PublicFormsService);

  /**
   * The entity instance that this form is associated with.
   * For example, a Child record when linking a feedback form to a specific child.
   */
  linkedEntity = input<Entity>();

  /**
   * The constructor of the entity type that the form submission will create.
   * This is typically different from the linkedEntity type.
   * For example, a FeedbackSubmission entity linked to a Child.
   */
  formEntityType = input<EntityConstructor>();

  matchingCustomForms = resource({
    params: () => ({
      linkedEntity: this.linkedEntity(),
      formEntityType: this.formEntityType(),
    }),
    loader: async ({ params: { linkedEntity, formEntityType } }) => {
      if (!linkedEntity || !formEntityType) return [];

      const allForms = await this.entityMapper.loadType(PublicFormConfig);
      const matchingForms = allForms.filter((config) =>
        this.publicFormsService.hasLinkedEntities(config),
      );

      const selectedForms: PublicFormConfig[] = [];
      for (const config of matchingForms) {
        const matchesCustomForm =
          await this.publicFormsService.isEntityTypeLinkedToConfig(
            config,
            linkedEntity,
          );
        const matchesEntityType = this.isMatchingFormEntityType(
          config,
          formEntityType,
        );
        if (matchesCustomForm && matchesEntityType) {
          selectedForms.push(config);
        }
      }
      return selectedForms;
    },
  });

  async copyLink(matchingCustomForm: PublicFormConfig) {
    const linkedEntity = this.linkedEntity();
    if (!matchingCustomForm) return;
    if (!linkedEntity) return;
    await this.publicFormsService.copyPublicFormLinkFromConfig(
      matchingCustomForm,
      linkedEntity,
    );
  }

  private isMatchingFormEntityType(
    config: PublicFormConfig,
    formEntityType: EntityConstructor,
  ): boolean {
    if (config.forms?.length) {
      return config.forms.some(
        (form) => form.entity === formEntityType.ENTITY_TYPE,
      );
    }

    return config.entity === formEntityType.ENTITY_TYPE;
  }
}
