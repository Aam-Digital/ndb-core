import { MarkedRenderer } from "ngx-markdown";
import { Tokens } from "marked";

export class MarkedRendererCustom extends MarkedRenderer {
  public override heading(input: Tokens.Heading): string {
    if (input.depth === 3) {
      switch (input.text.toLowerCase()) {
        case "bug fixes":
          return `<span class="badge-label background-changelog-bugfix">${input.text}</span>`;
        case "features":
          return `<span class="badge-label background-changelog-feature">${input.text}</span>`;
        default:
          return `<span class="badge-label background-changelog-unknown">${input.text}</span>`;
      }
    } else {
      return super.heading(input);
    }
  }
}
