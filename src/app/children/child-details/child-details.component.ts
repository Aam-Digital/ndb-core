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

import {Component, Inject} from '@angular/core';
import {Child} from '../child';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {Gender} from '../Gender';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

declare let require;

@Component({
  selector: 'app-child-details',
  templateUrl: './child-details.component.html',
  styleUrls: ['./child-details.component.css']
})
export class ChildDetailsComponent {


  child: Child = new Child("testID");

  creating: boolean = false;  //set true, if new child
  editable: boolean = false;  //set true, if existing child is edited

  gender = Gender;

  genders() : Array<string> {   //Transforms enum into an array for select component
    let genders = Object.keys(this.gender);
    return genders.slice(0, genders.length / 2);
  }

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
        title: 'Guardian'
      },
      age: {
        title: 'Age'
      },
      relationship: {
        title: 'Relationship'
      },
      mobileNo: {
        title: 'Mo. Number'
      },
      remarks: {
        title: 'Remarks'
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
        title: 'Class'
      },
      school: {
        title: 'School'
      },
      religion: {
        title: 'Medium'
      },
    }
  };

  data = [
    {
      name: 'hana',
      guardian: 'ich',
      age: '45',
      relationship: 'mother',
      mobileNo: '089765123',
      remarks: 'test',
    },
  ];

  // TODO Anlegen einer eigenen Klasse socialworker als subklasse von User
  socialworkers: String[];
  form: FormGroup;


  initializeForm(){
    this.form = this.fb.group({
      name: [{value: this.child.name, disabled:!this.editable}, Validators.required],
      gender: [{value: this.child.gender, disabled:!this.editable}],
      project: [{value: this.child.pn, disabled:!this.editable}],
      birthday: [{value: this.child.dateOfBirth, disabled:!this.editable}],
      motherTongue: [{value: this.child.motherTongue, disabled:!this.editable}],
      admission: [{value: this.child.admission, disabled:!this.editable}],
      religion: [{value: this.child.religion, disabled:!this.editable}]
    });
  }


  constructor(private entityMapperService: EntityMapperService, private route: ActivatedRoute,
              @Inject(FormBuilder) public fb: FormBuilder, public router: Router) {

    let id = this.route.snapshot.params['id'];
    if (id == "new") {
      this.creating = true;
      this.editable = true;
      let uniqid = require('uniqid');
      console.log("id: " + uniqid);
      this.child = new Child(uniqid());
    } else {
      this.entityMapperService.load<Child>(Child, id)
        .then(child => {
          this.child = child;
          this.initializeForm();
        })
        .catch(err => console.log(err + "load2"));
    }
    this.initializeForm();
  }

  switchEdit() {
    this.editable = !this.editable;
    this.initializeForm();
  }

  save() {
    this.child.name = this.form.get("name").value;
    this.child.gender = this.form.get("gender").value;
    this.child.religion = this.form.get("religion").value;
    this.child.pn = this.form.get("project").value;
    this.child.dateOfBirth = this.form.get("birthday").value;
    this.child.motherTongue = this.form.get("motherTongue").value;
    this.child.admission = this.form.get("admission").value;
    this.entityMapperService.save<Child>(this.child)
      .then(() => {
        if (this.creating) {
          // let route: string = this.router.url;
          // route = route.substring(0, route.lastIndexOf("/") + 1);  //deleting 'new' at the end
          // route += this.child.getId(); //Navigating to created child
          // this.router.navigate([route]); //routing to created child doesn't work
          this.creating = false;
        }
        this.switchEdit();
      })
      .catch((err) => console.log("err " + err))
  }
}
