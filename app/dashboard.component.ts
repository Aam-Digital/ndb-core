import { Component, OnInit } from 'angular2/core';


@Component({
    selector: 'ndb-dashboard',
    templateUrl: 'app/dashboard.component.html'
})

export class DashboardComponent implements OnInit {

    ngOnInit() {
        // load sections dynamically? or hard-code them in template?
    }
}
