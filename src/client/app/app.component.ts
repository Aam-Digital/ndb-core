import {Component, ViewContainerRef} from '@angular/core';

@Component({
    selector: 'ndb-app',
    template: '<ndb-ui></ndb-ui>'
})
export class AppComponent {
    private viewContainerRef: ViewContainerRef;

    public constructor(viewContainerRef: ViewContainerRef) {
        // You need this small hack in order to catch application root view container ref
        this.viewContainerRef = viewContainerRef;
    }
}
