import { Component, OnInit, Input } from '@angular/core';
import { SearchInformation } from '../model/search-information';

@Component({
  selector: 'app-search-information',
  templateUrl: './search-information.component.html',
  styleUrls: ['./search-information.component.scss']
})
export class SearchInformationComponent implements OnInit {
  @Input() entity: SearchInformation;

  constructor() { }

  ngOnInit() {
  }

}
