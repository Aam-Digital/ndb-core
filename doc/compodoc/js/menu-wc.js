'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">ndb-core documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                        <li class="link">
                            <a href="dependencies.html" data-type="chapter-link">
                                <span class="icon ion-ios-list"></span>Dependencies
                            </a>
                        </li>
                    </ul>
                </li>
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#additional-pages"'
                            : 'data-target="#xs-additional-pages"' }>
                            <span class="icon ion-ios-book"></span>
                            <span>test_additional_info</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"' }>
                                    <li class="link ">
                                        <a href="additional-documentation/example-file-for-additional-doc.html" data-type="entity-link" data-context-id="additional">example file for additional doc</a>
                                    </li>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/overview.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#additional-page-94c6b7ec410e4b167dcd78bad206a862"' : 'data-target="#xs-additional-page-94c6b7ec410e4b167dcd78bad206a862"' }>
                                                <span class="link-name">overview</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-94c6b7ec410e4b167dcd78bad206a862"' : 'id="xs-additional-page-94c6b7ec410e4b167dcd78bad206a862"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/overview/child-of-overview.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">child of overview</a>
                                            </li>
                                        </ul>
                                    </li>
                        </ul>
                    </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse" ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AdminModule.html" data-type="entity-link">AdminModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AdminModule-de40f8e28f53943f02a2414ad0f0b4a4"' : 'data-target="#xs-components-links-module-AdminModule-de40f8e28f53943f02a2414ad0f0b4a4"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AdminModule-de40f8e28f53943f02a2414ad0f0b4a4"' :
                                            'id="xs-components-links-module-AdminModule-de40f8e28f53943f02a2414ad0f0b4a4"' }>
                                            <li class="link">
                                                <a href="components/AdminComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AdminComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AlertsModule.html" data-type="entity-link">AlertsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AlertsModule-d392ae4550a86eb8e358771db1a6eb1b"' : 'data-target="#xs-components-links-module-AlertsModule-d392ae4550a86eb8e358771db1a6eb1b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AlertsModule-d392ae4550a86eb8e358771db1a6eb1b"' :
                                            'id="xs-components-links-module-AlertsModule-d392ae4550a86eb8e358771db1a6eb1b"' }>
                                            <li class="link">
                                                <a href="components/AlertComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AlertComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AlertsModule-d392ae4550a86eb8e358771db1a6eb1b"' : 'data-target="#xs-injectables-links-module-AlertsModule-d392ae4550a86eb8e358771db1a6eb1b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AlertsModule-d392ae4550a86eb8e358771db1a6eb1b"' :
                                        'id="xs-injectables-links-module-AlertsModule-d392ae4550a86eb8e358771db1a6eb1b"' }>
                                        <li class="link">
                                            <a href="injectables/AlertService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>AlertService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppConfigModule.html" data-type="entity-link">AppConfigModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppConfigModule-74a54943ad9332b0f0ee7a6cdb704a40"' : 'data-target="#xs-injectables-links-module-AppConfigModule-74a54943ad9332b0f0ee7a6cdb704a40"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppConfigModule-74a54943ad9332b0f0ee7a6cdb704a40"' :
                                        'id="xs-injectables-links-module-AppConfigModule-74a54943ad9332b0f0ee7a6cdb704a40"' }>
                                        <li class="link">
                                            <a href="injectables/AppConfig.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>AppConfig</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link">AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppModule-54ad6f60f972fc9eae173b790eba7bfc"' : 'data-target="#xs-components-links-module-AppModule-54ad6f60f972fc9eae173b790eba7bfc"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-54ad6f60f972fc9eae173b790eba7bfc"' :
                                            'id="xs-components-links-module-AppModule-54ad6f60f972fc9eae173b790eba7bfc"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AppComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppModule-54ad6f60f972fc9eae173b790eba7bfc"' : 'data-target="#xs-injectables-links-module-AppModule-54ad6f60f972fc9eae173b790eba7bfc"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-54ad6f60f972fc9eae173b790eba7bfc"' :
                                        'id="xs-injectables-links-module-AppModule-54ad6f60f972fc9eae173b790eba7bfc"' }>
                                        <li class="link">
                                            <a href="injectables/AppConfig.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>AppConfig</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ChildrenModule.html" data-type="entity-link">ChildrenModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ChildrenModule-61346edcb5a78852ec67c6b0f5275f9d"' : 'data-target="#xs-components-links-module-ChildrenModule-61346edcb5a78852ec67c6b0f5275f9d"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ChildrenModule-61346edcb5a78852ec67c6b0f5275f9d"' :
                                            'id="xs-components-links-module-ChildrenModule-61346edcb5a78852ec67c6b0f5275f9d"' }>
                                            <li class="link">
                                                <a href="components/AddDayAttendanceComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AddDayAttendanceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AddMonthAttendanceComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AddMonthAttendanceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AserComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AserComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AttendanceAverageDashboardComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AttendanceAverageDashboardComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AttendanceBlockComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AttendanceBlockComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AttendanceDayBlockComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AttendanceDayBlockComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AttendanceDaysComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AttendanceDaysComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AttendanceDetailsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AttendanceDetailsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AttendanceManagerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AttendanceManagerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AttendanceWarningsDashboardComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AttendanceWarningsDashboardComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AttendanceWeekDashboardComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AttendanceWeekDashboardComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChildAttendanceComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ChildAttendanceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChildBlockComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ChildBlockComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChildDetailsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ChildDetailsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChildSelectComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ChildSelectComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChildrenCountDashboardComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ChildrenCountDashboardComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChildrenListComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ChildrenListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EditSchoolDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">EditSchoolDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EducationalMaterialComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">EducationalMaterialComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/HealthCheckupComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">HealthCheckupComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NoteDetailsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">NoteDetailsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NotesComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">NotesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NotesManagerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">NotesManagerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewSchoolsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ViewSchoolsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-ChildrenModule-61346edcb5a78852ec67c6b0f5275f9d"' : 'data-target="#xs-injectables-links-module-ChildrenModule-61346edcb5a78852ec67c6b0f5275f9d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ChildrenModule-61346edcb5a78852ec67c6b0f5275f9d"' :
                                        'id="xs-injectables-links-module-ChildrenModule-61346edcb5a78852ec67c6b0f5275f9d"' }>
                                        <li class="link">
                                            <a href="injectables/ChildrenService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>ChildrenService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DashboardModule.html" data-type="entity-link">DashboardModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-DashboardModule-c66f244ca2e6862d7d9985cdca4f01aa"' : 'data-target="#xs-components-links-module-DashboardModule-c66f244ca2e6862d7d9985cdca4f01aa"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-DashboardModule-c66f244ca2e6862d7d9985cdca4f01aa"' :
                                            'id="xs-components-links-module-DashboardModule-c66f244ca2e6862d7d9985cdca4f01aa"' }>
                                            <li class="link">
                                                <a href="components/DashboardComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DashboardComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProgressDashboardComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ProgressDashboardComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/DatabaseModule.html" data-type="entity-link">DatabaseModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/EntityModule.html" data-type="entity-link">EntityModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-EntityModule-9faaa8542314d24c2ab99ba8658d8bae"' : 'data-target="#xs-injectables-links-module-EntityModule-9faaa8542314d24c2ab99ba8658d8bae"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-EntityModule-9faaa8542314d24c2ab99ba8658d8bae"' :
                                        'id="xs-injectables-links-module-EntityModule-9faaa8542314d24c2ab99ba8658d8bae"' }>
                                        <li class="link">
                                            <a href="injectables/EntityMapperService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>EntityMapperService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LatestChangesModule.html" data-type="entity-link">LatestChangesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-LatestChangesModule-051b491ee53227d47146ede354cf677a"' : 'data-target="#xs-components-links-module-LatestChangesModule-051b491ee53227d47146ede354cf677a"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LatestChangesModule-051b491ee53227d47146ede354cf677a"' :
                                            'id="xs-components-links-module-LatestChangesModule-051b491ee53227d47146ede354cf677a"' }>
                                            <li class="link">
                                                <a href="components/AppVersionComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AppVersionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChangelogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ChangelogComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-LatestChangesModule-051b491ee53227d47146ede354cf677a"' : 'data-target="#xs-injectables-links-module-LatestChangesModule-051b491ee53227d47146ede354cf677a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LatestChangesModule-051b491ee53227d47146ede354cf677a"' :
                                        'id="xs-injectables-links-module-LatestChangesModule-051b491ee53227d47146ede354cf677a"' }>
                                        <li class="link">
                                            <a href="injectables/LatestChangesService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>LatestChangesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UpdateManagerService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>UpdateManagerService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LoggingModule.html" data-type="entity-link">LoggingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/NavigationModule.html" data-type="entity-link">NavigationModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-NavigationModule-2c0641d078cc1b420c7267bd6c4d09e6"' : 'data-target="#xs-components-links-module-NavigationModule-2c0641d078cc1b420c7267bd6c4d09e6"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-NavigationModule-2c0641d078cc1b420c7267bd6c4d09e6"' :
                                            'id="xs-components-links-module-NavigationModule-2c0641d078cc1b420c7267bd6c4d09e6"' }>
                                            <li class="link">
                                                <a href="components/NavigationComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">NavigationComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-NavigationModule-2c0641d078cc1b420c7267bd6c4d09e6"' : 'data-target="#xs-injectables-links-module-NavigationModule-2c0641d078cc1b420c7267bd6c4d09e6"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NavigationModule-2c0641d078cc1b420c7267bd6c4d09e6"' :
                                        'id="xs-injectables-links-module-NavigationModule-2c0641d078cc1b420c7267bd6c4d09e6"' }>
                                        <li class="link">
                                            <a href="injectables/NavigationItemsService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>NavigationItemsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SchoolsModule.html" data-type="entity-link">SchoolsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SchoolsModule-1fe4012f93e933edc04dea68a3d5a84b"' : 'data-target="#xs-components-links-module-SchoolsModule-1fe4012f93e933edc04dea68a3d5a84b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SchoolsModule-1fe4012f93e933edc04dea68a3d5a84b"' :
                                            'id="xs-components-links-module-SchoolsModule-1fe4012f93e933edc04dea68a3d5a84b"' }>
                                            <li class="link">
                                                <a href="components/SchoolBlockComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SchoolBlockComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SchoolDetailComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SchoolDetailComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SchoolsListComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SchoolsListComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-SchoolsModule-1fe4012f93e933edc04dea68a3d5a84b"' : 'data-target="#xs-injectables-links-module-SchoolsModule-1fe4012f93e933edc04dea68a3d5a84b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SchoolsModule-1fe4012f93e933edc04dea68a3d5a84b"' :
                                        'id="xs-injectables-links-module-SchoolsModule-1fe4012f93e933edc04dea68a3d5a84b"' }>
                                        <li class="link">
                                            <a href="injectables/SchoolsService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>SchoolsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SessionModule.html" data-type="entity-link">SessionModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SessionModule-aeebd9c7e8b796ff008756982c7872e5"' : 'data-target="#xs-components-links-module-SessionModule-aeebd9c7e8b796ff008756982c7872e5"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SessionModule-aeebd9c7e8b796ff008756982c7872e5"' :
                                            'id="xs-components-links-module-SessionModule-aeebd9c7e8b796ff008756982c7872e5"' }>
                                            <li class="link">
                                                <a href="components/LoginComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">LoginComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-SessionModule-aeebd9c7e8b796ff008756982c7872e5"' : 'data-target="#xs-injectables-links-module-SessionModule-aeebd9c7e8b796ff008756982c7872e5"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SessionModule-aeebd9c7e8b796ff008756982c7872e5"' :
                                        'id="xs-injectables-links-module-SessionModule-aeebd9c7e8b796ff008756982c7872e5"' }>
                                        <li class="link">
                                            <a href="injectables/SessionService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>SessionService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SyncStatusModule.html" data-type="entity-link">SyncStatusModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SyncStatusModule-6f0ace2b357c39c78b9d6a120abcd744"' : 'data-target="#xs-components-links-module-SyncStatusModule-6f0ace2b357c39c78b9d6a120abcd744"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SyncStatusModule-6f0ace2b357c39c78b9d6a120abcd744"' :
                                            'id="xs-components-links-module-SyncStatusModule-6f0ace2b357c39c78b9d6a120abcd744"' }>
                                            <li class="link">
                                                <a href="components/InitialSyncDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">InitialSyncDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SyncStatusComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SyncStatusComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/UiHelperModule.html" data-type="entity-link">UiHelperModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' : 'data-target="#xs-components-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' :
                                            'id="xs-components-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' }>
                                            <li class="link">
                                                <a href="components/ConfirmationDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ConfirmationDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EntitySubrecordComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">EntitySubrecordComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' : 'data-target="#xs-injectables-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' :
                                        'id="xs-injectables-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' }>
                                        <li class="link">
                                            <a href="injectables/ConfirmationDialogService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>ConfirmationDialogService</a>
                                        </li>
                                    </ul>
                                </li>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#pipes-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' : 'data-target="#xs-pipes-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' :
                                            'id="xs-pipes-links-module-UiHelperModule-1826792788ac7d66e9b59f34dfff9c82"' }>
                                            <li class="link">
                                                <a href="pipes/KeysPipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">KeysPipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/UiModule.html" data-type="entity-link">UiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-UiModule-bba02954403744ca2c4d793b1d322558"' : 'data-target="#xs-components-links-module-UiModule-bba02954403744ca2c4d793b1d322558"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-UiModule-bba02954403744ca2c4d793b1d322558"' :
                                            'id="xs-components-links-module-UiModule-bba02954403744ca2c4d793b1d322558"' }>
                                            <li class="link">
                                                <a href="components/PrimaryActionComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">PrimaryActionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SearchComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SearchComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UiComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">UiComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserModule.html" data-type="entity-link">UserModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-UserModule-9368939b075d846686e09813a216189f"' : 'data-target="#xs-components-links-module-UserModule-9368939b075d846686e09813a216189f"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-UserModule-9368939b075d846686e09813a216189f"' :
                                            'id="xs-components-links-module-UserModule-9368939b075d846686e09813a216189f"' }>
                                            <li class="link">
                                                <a href="components/UserAccountComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">UserAccountComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse" ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/Alert.html" data-type="entity-link">Alert</a>
                            </li>
                            <li class="link">
                                <a href="classes/Aser.html" data-type="entity-link">Aser</a>
                            </li>
                            <li class="link">
                                <a href="classes/AttendanceDay.html" data-type="entity-link">AttendanceDay</a>
                            </li>
                            <li class="link">
                                <a href="classes/AttendanceMonth.html" data-type="entity-link">AttendanceMonth</a>
                            </li>
                            <li class="link">
                                <a href="classes/Changelog.html" data-type="entity-link">Changelog</a>
                            </li>
                            <li class="link">
                                <a href="classes/Child.html" data-type="entity-link">Child</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChildSchoolRelation.html" data-type="entity-link">ChildSchoolRelation</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChildWithRelation.html" data-type="entity-link">ChildWithRelation</a>
                            </li>
                            <li class="link">
                                <a href="classes/ColumnDescription.html" data-type="entity-link">ColumnDescription</a>
                            </li>
                            <li class="link">
                                <a href="classes/Database.html" data-type="entity-link">Database</a>
                            </li>
                            <li class="link">
                                <a href="classes/DemoData.html" data-type="entity-link">DemoData</a>
                            </li>
                            <li class="link">
                                <a href="classes/EducationalMaterial.html" data-type="entity-link">EducationalMaterial</a>
                            </li>
                            <li class="link">
                                <a href="classes/Entity.html" data-type="entity-link">Entity</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterSelection.html" data-type="entity-link">FilterSelection</a>
                            </li>
                            <li class="link">
                                <a href="classes/HealthCheck.html" data-type="entity-link">HealthCheck</a>
                            </li>
                            <li class="link">
                                <a href="classes/MenuItem.html" data-type="entity-link">MenuItem</a>
                            </li>
                            <li class="link">
                                <a href="classes/MockDatabase.html" data-type="entity-link">MockDatabase</a>
                            </li>
                            <li class="link">
                                <a href="classes/Note.html" data-type="entity-link">Note</a>
                            </li>
                            <li class="link">
                                <a href="classes/PouchDatabase.html" data-type="entity-link">PouchDatabase</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProgressDashboardConfig.html" data-type="entity-link">ProgressDashboardConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/School.html" data-type="entity-link">School</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolWithRelation.html" data-type="entity-link">SchoolWithRelation</a>
                            </li>
                            <li class="link">
                                <a href="classes/User.html" data-type="entity-link">User</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AlertService.html" data-type="entity-link">AlertService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AppConfig.html" data-type="entity-link">AppConfig</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BackupService.html" data-type="entity-link">BackupService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ChildrenService.html" data-type="entity-link">ChildrenService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ConfirmationDialogService.html" data-type="entity-link">ConfirmationDialogService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DatabaseManagerService.html" data-type="entity-link">DatabaseManagerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityMapperService.html" data-type="entity-link">EntityMapperService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LatestChangesService.html" data-type="entity-link">LatestChangesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LoggingService.html" data-type="entity-link">LoggingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MockDatabaseManagerService.html" data-type="entity-link">MockDatabaseManagerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NavigationItemsService.html" data-type="entity-link">NavigationItemsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PouchDatabaseManagerService.html" data-type="entity-link">PouchDatabaseManagerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolsService.html" data-type="entity-link">SchoolsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SessionService.html" data-type="entity-link">SessionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UpdateManagerService.html" data-type="entity-link">UpdateManagerService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#guards-links"' :
                            'data-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse" ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/AdminGuard.html" data-type="entity-link">AdminGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/LoggedInGuard.html" data-type="entity-link">LoggedInGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse" ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/IAppConfig.html" data-type="entity-link">IAppConfig</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse" ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});