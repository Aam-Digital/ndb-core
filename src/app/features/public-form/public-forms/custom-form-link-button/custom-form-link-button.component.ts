import { Component, Input, OnInit } from "@angular/core";
import { PublicFormConfig } from "app/features/public-form/public-form-config";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { PublicFormsService } from "../../public-forms.service";

@Component({
  selector: "app-custom-form-link-button",
  templateUrl: "./custom-form-link-button.component.html",
  standalone: true,
  imports: [MatButtonModule, MatTooltipModule, FontAwesomeModule],
})
export class CustomFormLinkButtonComponent implements OnInit {
  @Input() entity: Entity;
  @Input() entityType: EntityConstructor;

  public matchingCustomForm: PublicFormConfig | null = null;

  constructor(
    private entityMapper: EntityMapperService,
    private publicFormsService: PublicFormsService,
  ) {}

  async ngOnInit() {
    if (!this.entity || !this.entityType) return;

    const allForms = await this.entityMapper.loadType(PublicFormConfig);
    const matchingForms = allForms.filter((config) => config.linkedEntity?.id);

    for (const config of matchingForms) {
      const matchesCustomForm =
        await this.publicFormsService.getMatchingPublicFormConfigs(
          config,
          this.entity,
        );
      const matchesEntityType = config.entity === this.entityType.ENTITY_TYPE;

      if (matchesCustomForm && matchesEntityType) {
        this.matchingCustomForm = config;
        break;
      }
    }
  }

  async copyLink() {
    if (!this.matchingCustomForm) return;

    await this.publicFormsService.copyPublicFormLinkFromConfig(
      this.entity,
      this.matchingCustomForm,
    );
  }
}
