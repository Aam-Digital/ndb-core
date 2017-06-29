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

  constructor(private entityMapperService: EntityMapperService) {
    this.child = new Child("child:1");
    //this.child.name = "Tim Wiese";
   }

  ngOnInit() {

    this.entityMapperService.load(new Child("child:35")).then(child => this.child = child); 
  }

}
