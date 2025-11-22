import { Injectable, signal } from "@angular/core";

/**
 * Service to manage the expanded/collapsed state of admin overview sections.
 *
 * This service stores the currently expanded section in memory (not persisted across reloads).
 * It enables restoring the expanded state when navigating back from sub-sections,
 * and allows default expansion of a specific section ("config").
 */

@Injectable({ providedIn: "root" })
export class AdminSectionStateService {
  // Holds the currently expanded section id (default: 'config')
  private readonly expandedSection = signal<string | null>("config");

  setExpanded(sectionId: string): void {
    this.expandedSection.set(sectionId);
  }

  getExpanded(): string | null {
    return this.expandedSection();
  }

  clear(): void {
    this.expandedSection.set(null);
  }
}
