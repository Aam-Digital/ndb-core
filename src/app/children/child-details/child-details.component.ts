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

import { Component, OnInit } from '@angular/core';
import { Child } from '../child';
import { EntityMapperService } from '../../entity/entity-mapper.service';



@Component({
  selector: 'app-child-details',
  templateUrl: './child-details.component.html',
  styleUrls: ['./child-details.component.css']
})
export class ChildDetailsComponent implements OnInit {

  child: Child;
  centers: String[] = ['', 'Tikiapara', 'Liluah'];
  FamiliyTableSettings = {
    hideSubHeader: true,
    actions: false,
    columns: {
      name: {
        title: 'Name'
      },
      guardian: {
        title: "Guardian"
      },
      age: {
        title: "Age"
      },
      relationship:{
        title: "Relationship"
      },
      mobileNo: {
        title: "Mo. Number"
      },
      remarks: {
        title: "Remarks"
      }
    }
  };

  SchoolTableSettings = {
    hideSubHeader: true,
    actions: false,
    columns: {
      date: {
        title: 'Date'
      },
      class: {
        title: "Class"
      },
      school: {
        title: "School"
      },
      medium: {
        title: "Medium"
      },
    }
  };

  data = [
    {
      name: "hana",
      guardian: "ich",
      age: "45",
      relationship: "mother",
      mobileNo: "089765123",
      remarks: "test",
    },
  ]

  //TODO Anlegen einer eigenen Klasse socialworker als subklasse von User
  socialworkers: String[];

  constructor(private entityMapperService: EntityMapperService) {
    this.child = new Child('child:1');
    // this.child.name = "Tim Wiese";
  }

  ngOnInit() {

    this.entityMapperService.load(Child, 'child:2').then(child => this.child = child);
  }

}
