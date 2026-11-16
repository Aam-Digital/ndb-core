import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
  input,
  resource,
} from "@angular/core";
import { MarkdownPageModule } from "../markdown-page.module";
import { RouteTarget } from "../../../route-target";
import { resolveLocaleText } from "app/core/language/active-locale";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MarkdownContent } from "../markdown-content";

/**
 * Display markdown formatted page that is dynamically loaded based on the file defined in config.
 */
@RouteTarget("MarkdownPage")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-markdown-page",
  templateUrl: "./markdown-page.component.html",
  imports: [MarkdownPageModule],
})
export class MarkdownPageComponent {
  /** filepath to be loaded as markdown */
  markdownFile = input<string>();
  /** markdown entity content to be displayed */
  markdownEntityId = input<string>();

  private readonly entityMapper = inject(EntityMapperService);

  readonly markdownContentResource = resource({
    params: () => this.markdownEntityId(),
    loader: async ({ params: markdownEntityId }) => {
      if (!markdownEntityId) return "";
      const markdownEntity = await this.entityMapper
        .load(MarkdownContent, markdownEntityId)
        .catch((err) => {
          // a config pointing to a not (yet) existing content: show "Content not found"
          if (err?.status === 404) return undefined;
          throw err;
        });
      // the content may be configured per language - show the active one
      return resolveLocaleText(markdownEntity?.content) ?? "";
    },
  });

  /**
   * markdown content string for template use.
   * Empty if the entity could not be loaded,
   * because reading `value()` of a failed resource throws.
   */
  readonly markdownContent = computed(() =>
    this.markdownContentResource.hasValue()
      ? (this.markdownContentResource.value() ?? "")
      : "",
  );
}
