#!/usr/bin/env tsx
/**
 * Script to identify unused attributes in entity configurations.
 * For each EntityConfig object, checks if attribute IDs are used in any ViewConfig
 *
 * Run the script with
 npx tsx scripts/identify-unused-attributes.ts <path-to-config-file>
 *
 * WARNING: AI-generated script. Use with care.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { EntityConfig } from "#src/app/core/entity/entity-config";
import { Config } from "#src/app/core/config/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Recursively extract all attribute IDs referenced in a configuration object
 */
function extractAttributeIds(
  obj: any,
  collectedIds: Set<string> = new Set(),
): Set<string> {
  if (!obj || typeof obj !== "object") {
    return collectedIds;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (typeof item === "string") {
        collectedIds.add(item);
      } else {
        extractAttributeIds(item, collectedIds);
      }
    });
  } else {
    // Check common keys that reference attributes
    const attributeKeys = [
      "columns",
      "fields",
      "groupBy",
      "attribute",
      "id",
      "property",
      "forAttribute",
      "filters",
    ];

    for (const key of attributeKeys) {
      if (key in obj) {
        const value = obj[key];
        if (typeof value === "string") {
          collectedIds.add(value);
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === "string") {
              collectedIds.add(item);
            } else if (item && typeof item === "object" && "id" in item) {
              collectedIds.add(item.id);
            }
          });
        }
      }
    }

    // Recursively process all nested objects
    Object.values(obj).forEach((value) => {
      if (value && typeof value === "object") {
        extractAttributeIds(value, collectedIds);
      }
    });
  }

  return collectedIds;
}

/**
 * Convert entity type to possible route formats
 */
function getPossibleRoutes(
  entityType: string,
  entityConfig: EntityConfig,
): string[] {
  const routes: string[] = [];

  // Use explicit route if defined
  if (entityConfig.route) {
    routes.push(entityConfig.route);
  }

  // Convert camelCase to lowercase
  routes.push(entityType.toLowerCase());

  // Convert to camelCase with first letter lowercase
  routes.push(entityType.charAt(0).toLowerCase() + entityType.slice(1));

  // Convert PascalCase to kebab-case
  const kebab = entityType
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
  routes.push(kebab);

  return [...new Set(routes)]; // Remove duplicates
}

/**
 * Analyze a single entity and its views
 */
function analyzeEntity(
  entityType: string,
  entityConfig: EntityConfig,
  data: any,
): {
  entityType: string;
  totalAttributes: number;
  usedAttributes: string[];
  unusedAttributes: string[];
  foundViews: string[];
  foundInRelatedEntities: string[];
  possibleRoutes: string[];
} {
  const attributes = entityConfig.attributes || {};
  const totalAttributes = Object.keys(attributes).length;

  // Start with toStringAttributes as they are always used
  const usedAttributeIds = new Set<string>(
    entityConfig.toStringAttributes || [],
  );

  // Find all possible view keys
  const possibleRoutes = getPossibleRoutes(entityType, entityConfig);
  const foundViews: string[] = [];

  for (const route of possibleRoutes) {
    const listViewKey = `view:${route}`;
    const detailViewKey = `view:${route}/:id`;

    // Check list view
    if (data[listViewKey]) {
      foundViews.push(listViewKey);
      const viewAttrs = extractAttributeIds(data[listViewKey]);
      viewAttrs.forEach((id) => usedAttributeIds.add(id));
    }

    // Check detail view
    if (data[detailViewKey]) {
      foundViews.push(detailViewKey);
      const viewAttrs = extractAttributeIds(data[detailViewKey]);
      viewAttrs.forEach((id) => usedAttributeIds.add(id));
    }
  }

  // Check if this entity is used in RelatedEntities components in OTHER views
  const foundInRelatedEntities: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("view:") && value && typeof value === "object") {
      // Search for RelatedEntities components that reference this entityType
      const searchRelatedEntities = (obj: any): void => {
        if (!obj || typeof obj !== "object") return;

        if (
          obj.component === "RelatedEntities" &&
          obj.config?.entityType === entityType
        ) {
          if (!foundInRelatedEntities.includes(key)) {
            foundInRelatedEntities.push(key);
          }
          // Extract columns used for this entity
          const columns = obj.config?.columns || [];
          if (Array.isArray(columns)) {
            columns.forEach((col: any) => {
              if (typeof col === "string") {
                usedAttributeIds.add(col);
              } else if (col && typeof col === "object" && col.id) {
                usedAttributeIds.add(col.id);
              }
            });
          }
        }

        // Recursively search
        if (Array.isArray(obj)) {
          obj.forEach((item) => searchRelatedEntities(item));
        } else if (typeof obj === "object") {
          Object.values(obj).forEach((v) => searchRelatedEntities(v));
        }
      };

      searchRelatedEntities(value);
    }
  }

  // Determine unused attributes
  const allAttributeIds = new Set(Object.keys(attributes));
  const unusedAttributes = Array.from(allAttributeIds).filter(
    (id) => !usedAttributeIds.has(id),
  );

  return {
    entityType,
    totalAttributes,
    usedAttributes: Array.from(usedAttributeIds)
      .filter((id) => allAttributeIds.has(id))
      .sort(),
    unusedAttributes: unusedAttributes.sort(),
    foundViews,
    foundInRelatedEntities,
    possibleRoutes,
  };
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const configPath = args[0];

  if (!existsSync(configPath)) {
    console.error(`Error: Config file not found at ${configPath}`);
    process.exit(1);
  }

  console.log(`Analyzing config file: ${configPath}\n`);

  // Load config
  const configContent = readFileSync(configPath, "utf-8");
  const config: Config = JSON.parse(configContent);
  const data = config.data || {};

  // Find all entity configurations
  const entityKeys = Object.keys(data).filter((key) =>
    key.startsWith("entity:"),
  );

  console.log(`Found ${entityKeys.length} entities\n`);
  console.log("=".repeat(80));

  const results: any[] = [];

  // Analyze each entity
  for (const entityKey of entityKeys) {
    const entityType = entityKey.replace("entity:", "");
    const entityConfig: EntityConfig = data[entityKey];

    const result = analyzeEntity(entityType, entityConfig, data);
    results.push(result);

    console.log(`\nEntity: ${entityType}`);
    console.log(
      `  Label: ${entityConfig.label || "N/A"} (${entityConfig.labelPlural || "N/A"})`,
    );
    console.log(`  Total attributes: ${result.totalAttributes}`);
    console.log(`  Possible routes: ${result.possibleRoutes.join(", ")}`);
    console.log(
      `  Found views: ${result.foundViews.length > 0 ? result.foundViews.join(", ") : "NONE"}`,
    );

    if (
      result.foundInRelatedEntities &&
      result.foundInRelatedEntities.length > 0
    ) {
      console.log(
        `  Found in RelatedEntities: ${result.foundInRelatedEntities.join(", ")}`,
      );
    }

    if (
      result.foundViews.length === 0 &&
      (!result.foundInRelatedEntities ||
        result.foundInRelatedEntities.length === 0)
    ) {
      console.log(`  ⚠️  WARNING: No views or RelatedEntities usage found!`);
    }

    console.log(
      `  Used attributes (${result.usedAttributes.length}): ${result.usedAttributes.join(", ")}`,
    );

    if (result.unusedAttributes.length > 0) {
      console.log(
        `  ❌ UNUSED attributes (${result.unusedAttributes.length}): ${result.unusedAttributes.join(", ")}`,
      );
    } else {
      console.log(`  ✅ All attributes are used!`);
    }

    console.log("-".repeat(80));
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));

  const totalUnused = results.reduce(
    (sum, r) => sum + r.unusedAttributes.length,
    0,
  );
  const entitiesWithUnused = results.filter(
    (r) => r.unusedAttributes.length > 0,
  );

  console.log(`\nTotal entities: ${results.length}`);
  console.log(`Entities with unused attributes: ${entitiesWithUnused.length}`);
  console.log(`Total unused attributes: ${totalUnused}`);

  if (entitiesWithUnused.length > 0) {
    console.log("\nEntities with unused attributes:");
    entitiesWithUnused.forEach((r) => {
      console.log(
        `  - ${r.entityType}: ${r.unusedAttributes.length} unused (${r.unusedAttributes.join(", ")})`,
      );
    });
  }

  // Output JSON summary
  const outputPath = configPath.replace(
    ".json",
    "_unused_attributes_report.json",
  );
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed report saved to: ${outputPath}`);
}

main();

export { analyzeEntity, extractAttributeIds, getPossibleRoutes };
