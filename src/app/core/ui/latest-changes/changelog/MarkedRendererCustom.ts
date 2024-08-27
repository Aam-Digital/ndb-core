import { MarkedRenderer } from "ngx-markdown";

export class MarkedRendererCustom extends MarkedRenderer {
  public override heading(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    raw: string,
  ): string {
    if (level === 3) {
      switch (text.toLowerCase()) {
        case "bug fixes":
          return `<span class="badge-label background-changelog-bugfix">${text}</span>`;
        case "features":
          return `<span class="badge-label background-changelog-feature">${text}</span>`;
        default:
          return `<span class="badge-label background-changelog-unknown">${text}</span>`;
      }
    } else {
      return super.heading(text, level, raw);
    }
  }

  public override list(body: string, ordered: boolean, start: number): string {
    if (ordered) {
      return `<ol class="app-list mat-body-1">${body}</ol>`;
    } else {
      return `<ul class="app-list mat-body-1">${body}</ul>`;
    }
  }
}
