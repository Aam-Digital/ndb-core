import { Component, OnInit } from 'angular2/core';


@Component({
    selector: 'ndb-dashboard',
    templateUrl: 'app/dashboard/dashboard.component.html',
    styleUrls: ['app/dashboard/dashboard.component.css']
})

export class DashboardComponent implements OnInit {

    ngOnInit() {
        // load sections dynamically? or hard-code them in template?
    }

    /*
        TODO: how to "configure" or extend the dashboard dynamically rather than hard-code the template?
        different "widgets" (e.g. the panels "Children", "Schools" in HELGO DB)
        could be added through a "Service" that provides a list which we are using here in this Component
    */
}
