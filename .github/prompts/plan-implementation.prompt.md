# Plan Implementation

Design the technical approach for a feature or change.

## Steps

1. Analyze existing patterns in the codebase for similar features
2. Propose component/service structure following project conventions (see `AGENTS.md`)
3. Identify whether a config-driven approach applies
4. Suggest entity schema changes if needed (`@DatabaseEntity`, `@DatabaseField`)
5. Consider offline-first implications (PouchDB, sync)
6. Flag permissions/CASL considerations (`EntityAbility`, `DisableEntityOperationDirective`)
7. Propose incremental implementation steps

## Output

Provide:
- **Architecture**: Component/service structure with file paths
- **Entity changes**: New or modified entity fields and types
- **Config changes**: Any JSON configuration updates needed
- **Implementation steps**: Ordered list of incremental changes
- **Testing strategy**: Unit and e2e test approach
- **Risks**: Offline-first, permissions, backward compatibility concerns
