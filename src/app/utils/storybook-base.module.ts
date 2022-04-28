import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FaIconLibrary,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatNativeDateModule } from "@angular/material/core";
import { Angulartics2Module } from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";
import {
  entityRegistry,
  EntityRegistry,
} from "../core/entity/database-entity.decorator";
import { viewRegistry } from "../core/view/dynamic-components/dynamic-component.decorator";
import { routesRegistry } from "../app.routing";

/**
 * Utility module to be imported in Storybook stories to ensure central setup like fontawesome icons are available.
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    MatNativeDateModule,
    Angulartics2Module.forRoot(),
    RouterTestingModule,
  ],
  providers: [{ provide: EntityRegistry, useValue: entityRegistry }],
})
export class StorybookBaseModule {
  constructor(icons: FaIconLibrary) {
    icons.addIconPacks(fas, far);
    entityRegistry.allowDuplicates();
    viewRegistry.allowDuplicates();
    routesRegistry.allowDuplicates();
  }
}
