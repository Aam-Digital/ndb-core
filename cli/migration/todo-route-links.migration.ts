import {
  CONFIG_ENTITY_ROUTE_PREFIX,
  normalizeRoutePath,
} from "../../src/app/core/config/dynamic-routing/route-paths.js";
import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";
import { CONFIG_DOC_PATH } from "./migrations.js";

const TODO_PATH = "todo";
const TODO_VIEW_KEY = `view:${TODO_PATH}`;

/**
 * Point legacy links to the task list to its entity route.
 *
 * The app adds the entity list view for tasks at runtime (`addDefaultTodoViews`), so a config without
 * its own view config for that route got these links fixed only at runtime, and `latest-config-formats`
 * (which runs without the runtime default views) never persisted them:
 * - navigation menu items linking to the route get the entity type of tasks instead of the `link`
 * - ShortcutDashboard links to the route (or a sub-route) get the `/c/` prefix of entity routes
 *
 * A config with its own view config for the route that is not an entity list is left unchanged.
 */
export function migrateTodoRouteLinks(config: any): any {
  const data = config?.data;
  if (!data || typeof data !== "object") {
    return config;
  }
  const ownTodoView = data[TODO_VIEW_KEY];
  if (
    ownTodoView &&
    !ownTodoView.config?.entityType &&
    !ownTodoView.config?.entity
  ) {
    return config;
  }

  if (Array.isArray(data.navigationMenu?.items)) {
    data.navigationMenu.items = migrateNavMenuItems(data.navigationMenu.items);
  }

  for (const key of Object.keys(data)) {
    const widgets = key.startsWith("view:")
      ? data[key]?.config?.widgets
      : undefined;
    if (!Array.isArray(widgets)) continue;
    for (const widget of widgets) {
      if (
        widget?.component === "ShortcutDashboard" &&
        Array.isArray(widget.config?.shortcuts)
      ) {
        widget.config.shortcuts = widget.config.shortcuts.map(migrateShortcut);
      }
    }
  }

  return config;
}

function migrateNavMenuItems(items: any[]): any[] {
  return items.map((item) => {
    let migrated = item;
    if (
      item?.link &&
      !item.entityType &&
      normalizeRoutePath(item.link) === TODO_PATH
    ) {
      migrated = { ...item, entityType: "Todo" };
      delete migrated.link;
    }
    if (Array.isArray(migrated?.subMenu)) {
      migrated = {
        ...migrated,
        subMenu: migrateNavMenuItems(migrated.subMenu),
      };
    }
    return migrated;
  });
}

function migrateShortcut(shortcut: any): any {
  if (typeof shortcut?.link !== "string") {
    return shortcut;
  }
  const path = normalizeRoutePath(shortcut.link);
  if (path !== TODO_PATH && !path.startsWith(`${TODO_PATH}/`)) {
    return shortcut;
  }
  return { ...shortcut, link: `/${CONFIG_ENTITY_ROUTE_PREFIX}/${path}` };
}

/**
 * The config migrations that fixed these links at runtime have been removed (v4).
 * Without this, such a link opens the "not found" page.
 */
export const todoRouteLinks: MigrationDefinition = {
  id: "oneoff-20261022-todo-route-links",
  description:
    "Point navigation menu items and dashboard shortcuts linking to /todo to the Todo entity route. Safe to re-run.",

  async run(ctx): Promise<MigrationResult> {
    let config: unknown;
    try {
      config = await ctx.couchdb.get(CONFIG_DOC_PATH);
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 404) {
        return {
          changed: false,
          status: "failed",
          warnings: ["Config document not found"],
        };
      }
      const message = error instanceof Error ? error.message : String(error);
      ctx.log.error(`Failed to load config document: ${message}`);
      throw error;
    }

    const newConfig = migrateTodoRouteLinks(JSON.parse(JSON.stringify(config)));
    ctx.validateJson(newConfig);

    if (JSON.stringify(config) === JSON.stringify(newConfig)) {
      ctx.log.info("No links to the task list need migration");
      return { changed: false, status: "no-change" };
    }

    ctx.log.info("Config links to the task list with the legacy route");
    await ctx.put(CONFIG_DOC_PATH, newConfig);

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
