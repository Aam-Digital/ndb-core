import { inject, Injectable } from "@angular/core";
import { EntityDatatype } from "#src/app/core/basic-datatypes/entity/entity.datatype";
import {
  EntityAction,
  EntityActionGroup,
} from "#src/app/core/entity-details/entity-actions-menu/entity-action.interface";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntitySchema } from "#src/app/core/entity/schema/entity-schema";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { TranslatableTextDatatype } from "#src/app/core/config/translatable-text.datatype";
import { asArray } from "#src/app/utils/asArray";
import { FilterService } from "#src/app/core/filter/filter.service";
import { resolveLocaleText } from "#src/app/core/language/active-locale";
import { Logging } from "#src/app/core/logging/logging.service";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { WINDOW_TOKEN } from "#src/app/utils/di-tokens";
import { loadLinkedRecord } from "#src/app/core/basic-datatypes/entity/load-linked-records";
import {
  fillPlaceholders,
  getPlaceholders,
  isSupportedPlaceholder,
} from "#src/app/utils/placeholders/fill-placeholders";
import { TemplateExportContextService } from "../template-export/template-export-context/template-export-context.service";
import {
  ExternalLinkConfig,
  WEB_ADDRESS_PATTERN,
} from "./external-link-config";

const WEB_ADDRESS = new RegExp(`^${WEB_ADDRESS_PATTERN}$`);

const EXTERNAL_LINK_ICON = "external-link-alt";

const EXTERNAL_LINKS_GROUP: EntityActionGroup = {
  id: "external-links",
  label: $localize`:entity context menu:External Links`,
  icon: EXTERNAL_LINK_ICON,
};

/** with more links than this for a record, they are collapsed into a submenu */
const MAX_UNGROUPED_LINKS = 2;

/**
 * Offers the configured links to external sites ({@link ExternalLinkConfig})
 * as actions in the menu of a record.
 */
@Injectable({
  providedIn: "root",
})
export class ExternalLinksService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly ability = inject(EntityAbility);
  private readonly filterService = inject(FilterService);
  private readonly entities = inject(EntityRegistry);
  private readonly schemaService = inject(EntitySchemaService);
  private readonly placeholderContext = inject(TemplateExportContextService);
  private readonly window = inject(WINDOW_TOKEN);

  /** all link definitions, kept until one of them changes */
  private links: Promise<ExternalLinkConfig[]> | undefined;
  private isWatchingUpdates = false;

  /**
   * The actions for the links that are offered for the given record.
   *
   * The web addresses are built here already, so that clicking a link opens the tab
   * immediately: browsers block a tab opened after waiting for data as a popup.
   */
  async getActions(entity: Entity | undefined): Promise<EntityAction[]> {
    if (!entity) {
      return [];
    }

    // shared by all links of this menu, so that each linked record is loaded only once
    const linkedRecords = new Map<string, Promise<Entity | undefined>>();
    const offered = await Promise.all(
      (await this.loadLinks()).map(async (link) => ({
        link,
        url: await this.getUrlIfOffered(link, entity, linkedRecords),
      })),
    );
    const buildable = offered.filter(({ url }) => url !== undefined);
    const group =
      buildable.length > MAX_UNGROUPED_LINKS ? EXTERNAL_LINKS_GROUP : undefined;

    return buildable.map(({ link, url }) => {
      const title = resolveLocaleText(link.title) ?? "";
      return {
        action: `external-link-${link.getId(true)}`,
        label: title,
        icon: EXTERNAL_LINK_ICON,
        tooltip: $localize`:entity context menu tooltip:Open "${title}" in a new tab. This sends details of this record to that site.`,
        permission: "read",
        availableFor: "individual-only",
        group,
        execute: async () => {
          this.window.open(url, "_blank", "noopener");
          return true;
        },
      };
    });
  }

  /**
   * The web address of the link for the record, `undefined` if the link is not offered for it.
   * A link whose values cannot be read from the record (e.g. a malformed field value) is left out,
   * without affecting the other links.
   */
  private async getUrlIfOffered(
    link: ExternalLinkConfig,
    entity: Entity,
    linkedRecords: Map<string, Promise<Entity | undefined>>,
  ): Promise<string | undefined> {
    try {
      if (!this.isOfferedFor(link, entity)) {
        return undefined;
      }
      return await this.buildUrl(link, entity, linkedRecords);
    } catch (err) {
      // a problem of the data or the link definition of an instance, not one of our code
      Logging.debug("ExternalLinks: could not build the link", err, {
        link: link.getId(),
      });
      return undefined;
    }
  }

  private loadLinks(): Promise<ExternalLinkConfig[]> {
    if (!this.isWatchingUpdates) {
      this.isWatchingUpdates = true;
      this.entityMapper
        .receiveUpdates(ExternalLinkConfig)
        .subscribe(() => (this.links = undefined));
    }

    this.links ??= this.entityMapper
      .loadType(ExternalLinkConfig)
      .catch((err) => {
        this.links = undefined;
        Logging.warn("ExternalLinks: could not load link definitions", err);
        return [];
      });
    return this.links;
  }

  private isOfferedFor(link: ExternalLinkConfig, entity: Entity): boolean {
    return (
      link.entity === entity.getType() &&
      this.ability.can("read", link) &&
      this.isUsableUrl(link, entity) &&
      this.matchesCondition(link, entity)
    );
  }

  /**
   * Whether the link can be built for the record:
   * a web address whose placeholders refer to fields that exist.
   * Anything else is a mistake in the link definition, which the admin sees as the link missing.
   */
  private isUsableUrl(link: ExternalLinkConfig, entity: Entity): boolean {
    return (
      typeof link.url === "string" &&
      WEB_ADDRESS.test(link.url) &&
      getPlaceholders(link.url).every((placeholder) =>
        this.isKnownPlaceholder(placeholder, entity),
      )
    );
  }

  /**
   * Whether the placeholder reads an existing field:
   * `{d.field}`, `{d.linkedRecord.field}` (one linked record, not a list of them)
   * or `{c.user.field}`.
   */
  private isKnownPlaceholder(placeholder: string, entity: Entity): boolean {
    if (!isSupportedPlaceholder(placeholder)) {
      return false;
    }
    const [source, key, nestedKey, ...deeper] = placeholder.split(".");
    if (deeper.length > 0) {
      return false;
    }

    if (source === "c") {
      const user = this.placeholderContext.getComplement()?.user;
      // without a record linked to the account, the value is simply empty
      return (
        key === "user" &&
        (nestedKey === undefined ||
          !(user instanceof Entity) ||
          hasField(user.getSchema(), nestedKey))
      );
    }

    if (nestedKey === undefined) {
      return hasField(entity.getSchema(), key);
    }
    return this.getLinkedTypes(entity, key).some((type) =>
      hasField(type.schema, nestedKey),
    );
  }

  /** the record types a field links to, if it holds a single linked record */
  private getLinkedTypes(entity: Entity, key: string): EntityConstructor[] {
    const field = entity.getSchema().get(key);
    if (field?.dataType !== EntityDatatype.dataType || field.isArray) {
      return [];
    }
    return asArray(field.additional)
      .filter((type: string) => this.entities.has(type))
      .map((type: string) => this.entities.get(type));
  }

  private matchesCondition(link: ExternalLinkConfig, entity: Entity): boolean {
    if (!link.condition || Object.keys(link.condition).length === 0) {
      return true;
    }
    try {
      return this.filterService.getFilterPredicate(link.condition)(entity);
    } catch {
      // a condition that cannot be evaluated is a mistake in the link definition
      return false;
    }
  }

  private async buildUrl(
    link: ExternalLinkConfig,
    entity: Entity,
    linkedRecords: Map<string, Promise<Entity | undefined>>,
  ): Promise<string> {
    const record = this.toPlaceholderValues(
      entity,
      getFieldsReadBelow(link.url, ["d"]),
    );
    for (const key of this.getLinkedRecordKeys(link, entity)) {
      const linked = await this.getLinkedRecord(
        entity[key],
        this.getLinkedTypes(entity, key)[0],
        linkedRecords,
      );
      if (linked) {
        record[key] = this.toPlaceholderValues(
          linked,
          getFieldsReadBelow(link.url, ["d", key]),
        );
      }
    }

    const user = this.placeholderContext.getComplement()?.user;
    return fillPlaceholders(
      link.url,
      {
        d: record,
        c: {
          user:
            user instanceof Entity
              ? this.toPlaceholderValues(
                  user,
                  getFieldsReadBelow(link.url, ["c", "user"]),
                )
              : user,
        },
      },
      encodeURIComponent,
    );
  }

  /** the fields of linked records read by the link, e.g. `school` for `{d.school.name}` */
  private getLinkedRecordKeys(link: ExternalLinkConfig, entity: Entity) {
    const keys = getPlaceholders(link.url)
      .map((placeholder) => placeholder.split("."))
      .filter(([source, , nestedKey]) => source === "d" && nestedKey)
      .map(([, key]) => key)
      .filter((key) => this.getLinkedTypes(entity, key).length > 0);
    return new Set(keys);
  }

  /**
   * The linked record, or a stub with only its ID if it cannot be loaded
   * (so that `{d.school._id}` still works).
   */
  private async getLinkedRecord(
    id: unknown,
    defaultType: EntityConstructor,
    linkedRecords: Map<string, Promise<Entity | undefined>>,
  ): Promise<Entity | { _id: string } | undefined> {
    if (typeof id !== "string" || !id) {
      return undefined;
    }
    if (!linkedRecords.has(id)) {
      const type = id.includes(":")
        ? Entity.extractTypeFromId(id)
        : defaultType.ENTITY_TYPE;
      linkedRecords.set(id, loadLinkedRecord(this.entityMapper, type, id));
    }
    return (await linkedRecords.get(id)) ?? { _id: id };
  }

  /**
   * The values of the given fields of the record as stored (e.g. a date-only field as "2025-01-31",
   * a dropdown as its ID), with translatable texts in the active language.
   * Only the fields read by a link are transformed, so that a malformed value in another field does not matter.
   */
  private toPlaceholderValues(
    entity: Entity | { _id: string },
    fields: Set<string>,
  ): Record<string, unknown> {
    if (!(entity instanceof Entity)) {
      // a linked record that could not be loaded
      return { ...entity };
    }
    const schema: EntitySchema = new Map(
      [...entity.getSchema()].filter(([key]) => fields.has(key)),
    );
    const values = this.schemaService.transformEntityToDatabaseFormat(
      entity,
      schema,
    );
    for (const [key, field] of schema) {
      if (field.dataType === TranslatableTextDatatype.dataType) {
        values[key] = resolveLocaleText(entity[key]);
      }
    }
    values._id = entity.getId();
    return values;
  }
}

function hasField(schema: EntitySchema, key: string): boolean {
  return key === "_id" || schema.has(key);
}

/**
 * The fields read by the placeholders of the text directly below the given path,
 * e.g. `name` and `school` below `d` for `{d.name}` and `{d.school.name}`.
 */
function getFieldsReadBelow(text: string, path: string[]): Set<string> {
  const keys = getPlaceholders(text)
    .map((placeholder) => placeholder.split("."))
    .filter((parts) => path.every((part, i) => parts[i] === part))
    .map((parts) => parts[path.length])
    .filter((key) => key !== undefined);
  return new Set(keys);
}
