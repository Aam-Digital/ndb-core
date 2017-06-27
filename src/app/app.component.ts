import { Component, ViewContainerRef } from '@angular/core';

import './rxjs-operators';

@Component({
  selector: 'app-root',
  template: '<app-ui></app-ui>'
})
export class AppComponent {
  private viewContainerRef: ViewContainerRef;

  public constructor(viewContainerRef: ViewContainerRef) {
    // You need this small hack in order to catch application root view container ref
    this.viewContainerRef = viewContainerRef;
  }
}
