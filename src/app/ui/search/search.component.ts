import { Component, OnInit } from '@angular/core';
import {Database} from '../../database/database';
import {Router} from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  results;
  searchText = '';

  constructor(private db: Database,
              private router: Router) { }

  ngOnInit() {
    this.createSearchIndex();
  }

  private createSearchIndex() {
    // defined to avoid Typescript error. Actually `emit` is provided by pouchDB to the `map` function
    const emit = (x) => {};

    const designDoc = {
      _id: '_design/search_index',
      views: {
        by_name: {
          map: function (doc) { emit(doc.name ? doc.name.toLowerCase() : undefined); }.toString()
        }
      }
    };

    this.db.saveDatabaseIndex(designDoc);
  }


  search() {
    this.searchText = this.searchText.toLowerCase();
    this.db.query('search_index/by_name', {startkey: this.searchText, endkey: this.searchText + '\ufff0', include_docs: true})
      .then(queryResults => {
        this.results = queryResults.rows;
        console.log(this.results);
      });
  }


  openResult(result) {
    let routerParams;
    switch (result.type) {
      case 'Child': {
        routerParams = ['/child', result.entityId];
        break;
      }
      case 'School': {
        routerParams = ['/school', result.entityId];
        break;
      }
    }

    this.router.navigate(routerParams);
    this.searchText = '';
  }

}
