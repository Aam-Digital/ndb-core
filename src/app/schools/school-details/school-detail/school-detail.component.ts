import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from "@angular/router";

import {School} from "../../schoolsShared/school";
import { SchoolsServices } from "../../schoolsShared/schools.services";

@Component({
  selector: 'app-school-detail',
  templateUrl: './school-detail.component.html',
  styleUrls: ['./school-detail.component.css']
})
export class SchoolDetailComponent implements OnInit {
  school: School;

  constructor(
    private ss: SchoolsServices,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
    const params = this.route.snapshot.params;
    this.school = this.ss.getSingle(parseInt(params['id']));
  }

}
