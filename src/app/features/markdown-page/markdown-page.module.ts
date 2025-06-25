/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { MarkdownModule } from "ngx-markdown";
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { MarkdownContent } from "./markdown-content";

/**
 * Display any information contained in a markdown file.
 */
@NgModule({
  exports: [MarkdownModule],
  imports: [
    MarkdownModule.forRoot({
      loader: HttpClient,
    }),
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class MarkdownPageModule {
  private components = inject(ComponentRegistry);

  static databaseEntities = [MarkdownContent];

  constructor() {
    this.registerComponents();
  }

  private registerComponents() {
    if (this.components.has("MarkdownPage")) {
      return;
    }

    this.components.addAll([
      [
        "MarkdownPage",
        () =>
          import("./markdown-page/markdown-page.component").then(
            (c) => c.MarkdownPageComponent,
          ),
      ],
    ]);
  }
}
