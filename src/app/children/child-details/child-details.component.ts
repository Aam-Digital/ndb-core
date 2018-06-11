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

import {Component, OnInit} from '@angular/core';
import {Child} from '../child';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {Gender} from '../Gender';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-child-details',
  templateUrl: './child-details.component.html',
  styleUrls: ['./child-details.component.css']
})
export class ChildDetailsComponent implements OnInit {
  child: Child = new Child('');

  editable = false;   // editable schould be enabled by default and be activated by button

  gender = Gender;
  genderSelector;
  selectedGender;

  constructor(private entityMapperService: EntityMapperService, private route: ActivatedRoute) { }

  switchEdit() {
    this.editable = !this.editable;
  }

  ngOnInit() {
    const params = this.route.snapshot.params;
    const childId = params['id'];

    this.entityMapperService.load<Child>(Child, childId)
      .then(child => this.child = child);
    // this.editable = false;
    this.genderSelector = Object.keys(this.gender).filter(k => !isNaN(Number(k)));
    this.selectedGender = '0';
  }


}
