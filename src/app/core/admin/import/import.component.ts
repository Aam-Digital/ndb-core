import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { DynamicEntityService } from 'app/core/entity/dynamic-entity.service';
import { Entity, EntityConstructor } from 'app/core/entity/model/entity';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss']
})
export class ImportComponent implements OnInit {
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;

  constructor(
    private _formBuilder: FormBuilder,
    private dynamicEntityService: DynamicEntityService
    ) {}

  ngOnInit() {
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required],
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required],
    });
  }

  getEntitiesMap(): Map<string, EntityConstructor<Entity>> {
    return this.dynamicEntityService.EntityMap;
  }
}
