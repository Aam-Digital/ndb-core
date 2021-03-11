import { Injectable } from "@angular/core";

/**
 * This class dynamically adds sets up everything for Matomo.
 *
 * The code is inspired by:
 * https://github.com/Arnaud73/ngx-matomo/blob/master/projects/ngx-matomo/src/lib/matomo-injector.service.ts
 */
@Injectable({
  providedIn: "root",
})
export class MatomoService {
  constructor() {
    window["_paq"] = window["_paq"] || [];
  }

  public setUp(url: string, id: string = "3") {
    window["_paq"].push([
      "setDocumentTitle",
      document.domain + "/" + document.title,
    ]);
    window["_paq"].push(["trackPageView"]);
    window["_paq"].push(["enableLinkTracking"]);
    (() => {
      const u = "//" + url;
      window["_paq"].push(["setTrackerUrl", u + "matomo.php"]);
      window["_paq"].push(["setSiteId", id]);
      const d = document;
      const g = d.createElement("script");
      const s = d.getElementsByTagName("script")[0];
      g.type = "text/javascript";
      g.async = true;
      g.defer = true;
      g.src = u + "matomo.js";
      s.parentNode.insertBefore(g, s);
    })();
  }
}
