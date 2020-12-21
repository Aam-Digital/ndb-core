import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";

/**
 * A wrapper module to use MatIcon with font-awesome as default icon font set up.
 *
 * This allows encapsulated configuration and loading e.g. in storybook.
 */
@NgModule({
  declarations: [],
  imports: [CommonModule, MatIconModule],
  exports: [MatIconModule],
})
export class FontAwesomeIconsModule {
  constructor(public matIconRegistry: MatIconRegistry) {
    matIconRegistry.registerFontClassAlias("fontawesome", "fa");
    matIconRegistry.setDefaultFontSetClass("fa");
  }
}
