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
import {Gender} from "../Gender";
import {ActivatedRoute} from "@angular/router";



@Component({
  selector: 'app-child-details',
  templateUrl: './child-details.component.html',
  styleUrls: ['./child-details.component.css']
})
export class ChildDetailsComponent implements OnInit {

  child= new Child("test");
  editable = new Boolean();
  gender = Gender;
  genderSelector;
  selectedGender;
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

  constructor(private entityMapperService: EntityMapperService, private route: ActivatedRoute) {


  }

  switchEdit() {
    if (this.editable){
      this.editable = false;
    } else {
      this.editable = true;
    }
  }

  ngOnInit() {
    const params = this.route.snapshot.params;
    let id = params['id'];    //Id number of child we want to load

    this.entityMapperService.load(Child, 'child:' + id).then( child => {this.child= child})
    //this.entityMapperService.remove(child).then( (res) => console.log(res)).catch( (err)=> console.log(err + "remove")))
      .catch(err => {
        console.log(err + "load");
        this.child = new Child("child:4");
        //this.entityMapperService.remove(this.child).then( (res) => console.log(res)).catch( (err)=> console.log(err + "remove"));
        this.child.name = "Fabi 4";
        this.child.pn = 4; // project number
        this.child.religion = "Hindu";
        this.child.gender = Gender.MALE;
        this.child.dateOfBirth = "2000-03-01";
        this.child.motherTongue = "Hindi";
        this.child.admission = "2013-10-04";
        this.child.placeOfBirth = "Kambotsha";
        this.child.center = "Takatiki";
        this.entityMapperService.save(this.child).then((res) => console.log(res + "fullfilled save")).then((res) =>
          this.entityMapperService.load(Child, 'child:4').then(child => this.child = child).catch(err => console.log(err + "load2")))
          .catch((err) => console.log(err + "save"));
      });
    // this.editable = false;
    this.genderSelector = Object.keys(this.gender).filter(k => !isNaN(Number(k)))
    this.selectedGender = "0";
  }


}
