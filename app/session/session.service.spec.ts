import { SessionService } from "./session.service";
import { User } from "../user/user";

describe('session service tests', () => {
    let sessionService: SessionService;
    let databaseManager;
    let entityMapper;
    let alertService;

    let username = "testuser";
    let password = "testpass";
    let user = new User(username);
    user.setNewPassword(password);

    beforeEach(() => {
        databaseManager = {
            loggedIn: false,
            login: function (loginName: string, loginPassword: string): Promise<boolean> {
                if (loginName == username && user.checkPassword(loginPassword)) {
                    this.loggedIn = true;
                    return Promise.resolve(true);
                }
                else
                    return Promise.resolve(false);
            },

            logout: function () {
            }
        };
        spyOn(databaseManager, 'login').and.callThrough();


        entityMapper = {
            load: function (resultEntity: User): Promise<User> {

                if (resultEntity.getId() != user.getId()) {
                    return Promise.reject<User>("ID not found");
                }
                else {
                    Object.assign(resultEntity, user);
                    return Promise.resolve<User>(resultEntity);
                }
            }
        };


        alertService = jasmine.createSpyObj('alertService', ['addInfo', 'addSuccess', 'addWarning', 'addDanger']);

        sessionService = new SessionService(databaseManager, entityMapper, alertService);
    });


    it('is logged in after correct local login', function (done) {
        expect(sessionService.isLoggedIn()).toBeFalsy();

        sessionService.login(username, password).then(
            function (result) {
                expect(result).toBeTruthy();
                expect(sessionService.isLoggedIn()).toBeTruthy();
                done();
            }
        );
    });

    it('is logged in on remote database after correct login', function (done) {
        expect(sessionService.isLoggedIn()).toBeFalsy();
        expect(databaseManager.loggedIn).toBeFalsy();

        sessionService.login(username, password).then(
            function (result) {
                expect(result).toBeTruthy();
                expect(databaseManager.loggedIn).toBeTruthy();
                done();
            }
        );
    });

    it('is not logged in after failed local login on existing user', function (done) {
        expect(sessionService.isLoggedIn()).toBeFalsy();

        sessionService.login(username, password + "x").then(
            function (result) {
                expect(result).toBeFalsy();
                expect(sessionService.isLoggedIn()).toBeFalsy();
                done();
            }
        );
    });


    it('is not logged in even when remote login succeeds', function (done) {
        expect(sessionService.isLoggedIn()).toBeFalsy();

        // setup: override entityMapper behavior to only return user after remote login
        spyOn(entityMapper, 'load').and.callFake(
            function (requestedUser: User) {
                if (databaseManager.loggedIn) {
                    // simulate synced database
                    Object.assign(requestedUser, user);
                    return Promise.resolve<User>(requestedUser);
                }
                else
                    return Promise.reject<User>("not found")
            }
        );

        entityMapper.load(user).catch(
            //expect entityMapper to NOT load user
            function () {
                sessionService.login(username, password).then(
                    function (result) {
                        expect(result).toBeFalsy();
                        expect(databaseManager.loggedIn).toBeTruthy();
                        expect(sessionService.isLoggedIn()).toBeFalsy();
                        done();
                    }
                );
            }
        );
    });


    it('is not logged in after logout', function (done) {
        sessionService.login(username, password).then(
            function () {
                expect(sessionService.isLoggedIn()).toBeTruthy();

                sessionService.logout();

                expect(sessionService.isLoggedIn()).toBeFalsy();
                done();
            }
        );
    });

    it('can logout when not logged in', function () {
        expect(sessionService.isLoggedIn()).toBeFalsy();

        sessionService.logout();

        expect(sessionService.isLoggedIn()).toBeFalsy();
    });
});
