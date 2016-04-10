import {Injectable} from "angular2/core";
import {ConfigService} from "../config/config.service";
import {log} from "typings/dist/support/cli";
import {AppDB, AppDBSync, AppDBError, AppDBResult} from "concepts.interface.ts";

@Injectable()
export class AppDBService extends AppDBSync {


    login(username:string, password:string) {
    }


    logout():void {
    }

    registerErrorListener(callback:(err:AppDBError)=>void):void {
    }

    registerResultListener(callback:(res:AppDBResult)=>void):void {
    }

// db:PouchDB = new PouchDB(this._config.database.name);
    //
    //
    // options = {
    //     skipSetup: true,
    //     ajax: {
    //         rejectUnauthorized: false,
    //         timeout: this._config.database.timeout
    //     }
    // };
    //
    // remoteDB:PouchDB = new PouchDB(this._config.database.remote_url + this._config.database.name,
    //     this.options, function (err:PouchError, db:PouchDB) {
    //         log(err.error);
    //         log(err.reason);
    //
    //         log(db.id());
    //         log(this.remoteDB.id());
    //     }
    // );

}
