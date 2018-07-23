import {Component, Input, OnInit} from '@angular/core';
import {Aser} from '../aser';

@Component({
  selector: 'app-aser-block',
  templateUrl: './aser-block.component.html',
  styleUrls: ['./aser-block.component.scss']
})
export class AserBlockComponent implements OnInit {
  @Input() entity: Aser;

  constructor() { }

  ngOnInit() {
  }

}
