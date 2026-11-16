import { inject, Injectable } from "@angular/core";
import { EntityDatatype } from "#src/app/core/basic-datatypes/entity/entity.datatype";
import {
  EntityAction,
  EntityActionGroup,
} from "#src/app/core/entity-details/entity-actions-menu/entity-action.interface";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRelationResolverService } from "#src/app/core/entity/entity-relation-resolver/entity-relation-resolver.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { FilterService } from "#src/app/core/filter/filter.service";
import { resolveLocaleText } from "#src/app/core/language/active-locale";
import { Logging } from "#src/app/core/logging/logging.service";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { WINDOW_TOKEN } from "#src/app/utils/di-tokens";
import {
  fillPlaceholders,
  getPlaceholders,
  isSupportedPlaceholder,
} from "#src/app/utils/placeholders/fill-placeholders";
import { TemplateExportContextService } from "../template-export/template-export-context/template-export-context.service";
import { ExternalLinkConfig } from "./external-link-config";

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
  private readonly relationResolver = inject(EntityRelationResolverService);
  private readonly placeholderContext = inject(TemplateExportContextService);
  private readonly window = inject(WINDOW_TOKEN);

  /** all link definitions, kept until one of them changes */
  private links: Promise<ExternalLinkConfig[]> | undefined;
  private isWatchingUpdates = false;

  /**
   * The actions for the links that are offered for the given record.
   */
  async getActions(entity: Entity | undefined): Promise<EntityAction[]> {
    if (!entity) {
      return [];
    }

    const links = (await this.loadLinks()).filter((link) =>
      this.isOfferedFor(link, entity),
    );
    const group =
      links.length > MAX_UNGROUPED_LINKS ? EXTERNAL_LINKS_GROUP : undefined;

    return links.map((link) => {
      const title = resolveLocaleText(link.title) ?? "";
      return {
        action: `external-link-${link.getId(true)}`,
        label: title,
        icon: EXTERNAL_LINK_ICON,
        tooltip: $localize`:entity context menu tooltip:Open "${title}" in a new tab. This sends details of this record to that site.`,
        permission: "read",
        availableFor: "individual-only",
        group,
        execute: () => this.open(link, entity),
      };
    });
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
    if (typeof link.url !== "string" || !/^https?:\/\//i.test(link.url)) {
      return false;
    }

    return getPlaceholders(link.url).every((placeholder) => {
      if (!isSupportedPlaceholder(placeholder)) {
        return false;
      }
      const [source, key] = placeholder.split(".");
      return source === "c"
        ? key === "user"
        : key === "_id" || entity.getSchema().has(key);
    });
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

  private async open(link: ExternalLinkConfig, entity: Entity): Promise<true> {
    const url = fillPlaceholders(
      link.url,
      {
        // loading linked records only if needed keeps opening the tab a direct result of the click,
        // which browsers require to not block it as a popup
        d: this.usesLinkedRecords(link, entity)
          ? await this.relationResolver.resolveRelations(entity)
          : entity,
        c: this.placeholderContext.getComplement() ?? {},
      },
      encodeURIComponent,
    );
    this.window.open(url, "_blank", "noopener");
    return true;
  }

  /** whether a placeholder reads a field of a linked record, e.g. `{d.school.name}` */
  private usesLinkedRecords(link: ExternalLinkConfig, entity: Entity): boolean {
    return getPlaceholders(link.url).some((placeholder) => {
      const [source, key, nestedKey] = placeholder.split(".");
      return (
        source === "d" &&
        nestedKey !== undefined &&
        entity.getSchema().get(key)?.dataType === EntityDatatype.dataType
      );
    });
  }
}
