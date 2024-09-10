import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Entity } from "../model/entity";
import { EntitySchemaService } from "../schema/entity-schema.service";
import {
  CascadingActionResult,
  CascadingEntityAction,
} from "./cascading-entity-action";
import { OkButton } from "../../common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";

/**
 * Safely delete an entity including handling references with related entities.
 * This service is usually used in combination with the `EntityActionsService`, which provides user confirmation processes around this.
 */
@Injectable({
  providedIn: "root",
})
export class EntityEditService extends CascadingEntityAction {
  constructor(
    protected override entityMapper: EntityMapperService,
    protected override schemaService: EntitySchemaService,
    private keycloakAuthService: KeycloakAuthService,
    private confirmationDialog: ConfirmationDialogService,
  ) {
    super(entityMapper, schemaService);
  }
}
