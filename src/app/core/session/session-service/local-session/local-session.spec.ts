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

import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { AppConfig } from "../../../app-config/app-config";
import { LocalSession } from "./local-session";
import { SessionType } from "../../session-type";
import { LocalUser } from "./local-user";
import * as CryptoJS from "crypto-js";

describe("LocalSessionService", () => {
  let localSession: LocalSession;
  let username = "demo";
  let password = "pass";
  let testUser: LocalUser;

  beforeEach(() => {
    AppConfig.settings = {
      site_name: "Aam Digital - DEV",
      session_type: SessionType.synced,
      database: {
        name: "integration_tests",
        remote_url: "https://demo.aam-digital.com/db/",
      },
    };

    localSession = new LocalSession(new EntitySchemaService());
  });

  beforeEach(() => {
    const cryptKeySize = 256 / 32;
    const cryptIterations = 128;
    const cryptSalt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const hash = CryptoJS.PBKDF2(password, cryptSalt, {
      keySize: cryptKeySize,
      iterations: cryptIterations,
    }).toString();
    testUser = {
      name: username,
      roles: ["user_app"],
      keysize: cryptKeySize,
      iterations: cryptIterations,
      salt: cryptSalt,
      hash: hash,
    };
    localSession.saveUser(testUser);
  });

  it("should be created", async () => {
    expect(localSession).toBeDefined();
  });

  it("should save user objects to local storage", () => {
    const storedUser = window.localStorage.getItem(testUser.name);
    expect(JSON.parse(storedUser)).toEqual(testUser);
  });
});
