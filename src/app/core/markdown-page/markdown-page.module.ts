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

import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MarkdownPageComponent } from "./markdown-page/markdown-page.component";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { MarkdownModule, MarkedOptions, MarkedRenderer } from "ngx-markdown";

function markedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer();

  renderer.heading = (text, level) => {
    if (level === 3) {
      console.log(text);
      switch (text.toLowerCase()) {
        case "bug fixes":
          return `<span class="badge-label background-changelog-bugfix">${text}</span>`;
        case "features":
          return `<span class="badge-label background-changelog-feature">${text}</span>`;
        default:
          return `<span class="badge-label background-changelog-unknown">${text}</span>`;
      }
    } else {
      return `<h${level}>${text}</h${level}>`;
    }
  };

  renderer.list = (body, ordered) => {
    if (ordered) {
      return `<ol class="app-list mat-body-1">${body}</ol>`;
    } else {
      return `<ul class="app-list mat-body-1">${body}</ul>`;
    }
  };

  return {
    renderer: renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
    smartLists: true,
    smartypants: false,
  };
}

/**
 * Display any information contained in a markdown file.
 */
@NgModule({
  declarations: [MarkdownPageComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    MarkdownModule.forRoot({
      loader: HttpClient,
      markedOptions: {
        provide: MarkedOptions,
        useFactory: markedOptionsFactory,
      },
    }),
  ],
})
export class MarkdownPageModule {
  static dynamicComponents = [MarkdownPageComponent];
}
