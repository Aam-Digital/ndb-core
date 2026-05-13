import {
  Component,
  effect,
  input,
  signal,
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

  public matchingCustomForms = signal<PublicFormConfig[]>([]);

  constructor() {
    effect((onCleanup) => {
      const linkedEntity = this.linkedEntity();
      const formEntityType = this.formEntityType();
      if (!linkedEntity || !formEntityType) {
        this.matchingCustomForms.set([]);
        return;
      }

      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      void this.loadMatchingForms(
        linkedEntity,
        formEntityType,
        () => cancelled,
      );
    });
  }

  private async loadMatchingForms(
    linkedEntity: Entity,
    formEntityType: EntityConstructor,
    isCancelled: () => boolean,
  ): Promise<void> {
    const allForms = await this.entityMapper.loadType(PublicFormConfig);
    if (isCancelled()) {
      return;
    }
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
      if (isCancelled()) {
        return;
      }
      const matchesEntityType = this.isMatchingFormEntityType(
        config,
        formEntityType,
      );

      if (matchesCustomForm && matchesEntityType) {
        selectedForms.push(config);
      }
    }
    if (isCancelled()) {
      return;
    }
    this.matchingCustomForms.set(selectedForms);
  }

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
