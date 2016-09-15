// import 'rxjs/Rx'; // adds ALL RxJS statics & operators to Observable

// See node_module/rxjs/Rxjs.js
// Import just the rxjs statics and operators we need for THIS app.

// Statics
import 'rxjs/observable/throw';

// Operators
import 'rxjs/operator/catch';
import 'rxjs/operator/debounceTime';
import 'rxjs/operator/distinctUntilChanged';
import 'rxjs/operator/map';
import 'rxjs/operator/switchMap';
import 'rxjs/operator/toPromise';
