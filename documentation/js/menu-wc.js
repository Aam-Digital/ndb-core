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
                            <a href="contributing.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CONTRIBUTING
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
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#additional-pages"'
                            : 'data-bs-target="#xs-additional-pages"' }>
                            <span class="icon ion-ios-book"></span>
                            <span>Developer Documentation</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"' }>
                                    <li class="link ">
                                        <a href="additional-documentation/overview.html" data-type="entity-link" data-context-id="additional">Overview</a>
                                    </li>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/tutorial.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#additional-page-6794468a17cff7a7d0e67b442fb30e72ef3581855216dac864cc271ec89410453a51ac5332e243886355cb46945ee4cf52c90b65c4ec9af1ba2b7fc3cfaa22d7"' : 'data-bs-target="#xs-additional-page-6794468a17cff7a7d0e67b442fb30e72ef3581855216dac864cc271ec89410453a51ac5332e243886355cb46945ee4cf52c90b65c4ec9af1ba2b7fc3cfaa22d7"' }>
                                                <span class="link-name">Tutorial</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-6794468a17cff7a7d0e67b442fb30e72ef3581855216dac864cc271ec89410453a51ac5332e243886355cb46945ee4cf52c90b65c4ec9af1ba2b7fc3cfaa22d7"' : 'id="xs-additional-page-6794468a17cff7a7d0e67b442fb30e72ef3581855216dac864cc271ec89410453a51ac5332e243886355cb46945ee4cf52c90b65c4ec9af1ba2b7fc3cfaa22d7"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/tutorial/overview-of-technologies.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Overview of Technologies</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/tutorial/setting-up-the-project.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Setting up the project</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/tutorial/using-aam-digital-(as-a-user).html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Using Aam Digital (as a user)</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/tutorial/diving-into-the-code.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Diving into the Code</a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/concepts.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#additional-page-58331cb4cbdd25099c4fb93264bac51d1fd1cd168914a2101cbfde231aa5bdb8f3e7bde9380d5ab143d6815d2b10412620dacce7ec5123a9a4f11a48d8005fb8"' : 'data-bs-target="#xs-additional-page-58331cb4cbdd25099c4fb93264bac51d1fd1cd168914a2101cbfde231aa5bdb8f3e7bde9380d5ab143d6815d2b10412620dacce7ec5123a9a4f11a48d8005fb8"' }>
                                                <span class="link-name">Concepts</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-58331cb4cbdd25099c4fb93264bac51d1fd1cd168914a2101cbfde231aa5bdb8f3e7bde9380d5ab143d6815d2b10412620dacce7ec5123a9a4f11a48d8005fb8"' : 'id="xs-additional-page-58331cb4cbdd25099c4fb93264bac51d1fd1cd168914a2101cbfde231aa5bdb8f3e7bde9380d5ab143d6815d2b10412620dacce7ec5123a9a4f11a48d8005fb8"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/concepts/overall-architecture.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Overall Architecture</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/concepts/extendability-and-plugin-approach.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Extendability and Plugin Approach</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/concepts/entity-system.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Entity System</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/concepts/entity-system/entity-schema.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Entity Schema</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/concepts/entity-system/archiving,-anonymizing-and-deleting-entities.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Archiving, Anonymizing and Deleting Entities</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/concepts/configuration.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Configuration</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/concepts/session-and-authentication-system.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Session and Authentication System</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/concepts/user-roles-and-permissions.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">User Roles and Permissions</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/concepts/security.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Security</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/concepts/ux-guidelines.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">UX Guidelines</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/concepts/documentation-structure.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Documentation Structure</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/concepts/infrastructure.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Infrastructure</a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/how-to-guides.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#additional-page-b0f047148a51bc3e1dd7667e9f327a64c1f35810acbee8f79503c8c240bb3716780fbb196df5d7a0927bde69416e3608502b26b7da728b480997d8593a8e0dc6"' : 'data-bs-target="#xs-additional-page-b0f047148a51bc3e1dd7667e9f327a64c1f35810acbee8f79503c8c240bb3716780fbb196df5d7a0927bde69416e3608502b26b7da728b480997d8593a8e0dc6"' }>
                                                <span class="link-name">How-To Guides</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-b0f047148a51bc3e1dd7667e9f327a64c1f35810acbee8f79503c8c240bb3716780fbb196df5d7a0927bde69416e3608502b26b7da728b480997d8593a8e0dc6"' : 'id="xs-additional-page-b0f047148a51bc3e1dd7667e9f327a64c1f35810acbee8f79503c8c240bb3716780fbb196df5d7a0927bde69416e3608502b26b7da728b480997d8593a8e0dc6"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/development-processes.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Development Processes</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/how-to-guides/development-processes/write-automated-unit-tests.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Write Automated Unit Tests</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/how-to-guides/development-processes/document-code.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Document Code</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/how-to-guides/development-processes/review-a-pull-request.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Review a Pull Request</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/configure-and-customize-a-system.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Configure and Customize a System</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/navigate-the-code-structure.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Navigate the Code Structure</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/create-a-new-entity-type.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Create a New Entity Type</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/create-a-custom-view-component.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Create a custom View Component</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/create-an-entity-details-panel.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Create an Entity Details Panel</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/create-a-new-datatype.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Create a New Datatype</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/create-a-report.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Create a Report</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/load-and-save-data.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Load and Save Data</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/display-dialogs-and-notifications.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Display Dialogs and Notifications</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/display-related-entities.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Display Related Entities</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/log-errors.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Log Errors</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/use-queries-and-indices.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Use Queries and Indices</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/generate-demo-data.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Generate Demo Data</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/format-data-export.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Format Data Export</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/how-to-guides/build-localizable-(translatable)-ui.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Build localizable (translatable) UI</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/how-to-guides/build-localizable-(translatable)-ui/work-with-xlf.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Work with XLF</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/how-to-guides/build-localizable-(translatable)-ui/add-another-language.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Add Another Language</a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/prerequisites.html" data-type="entity-link" data-context-id="additional">Prerequisites</a>
                                    </li>
                        </ul>
                    </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AdminModule.html" data-type="entity-link" >AdminModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AppModule-7a8f072dec91141a7767920e53fc99acfc1dd760395b55874cec95dd0324ddf6383c56e5370f392e12d64fae54768ccb84b55fa83c8c2702f95d106d00b977b8"' : 'data-bs-target="#xs-components-links-module-AppModule-7a8f072dec91141a7767920e53fc99acfc1dd760395b55874cec95dd0324ddf6383c56e5370f392e12d64fae54768ccb84b55fa83c8c2702f95d106d00b977b8"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-7a8f072dec91141a7767920e53fc99acfc1dd760395b55874cec95dd0324ddf6383c56e5370f392e12d64fae54768ccb84b55fa83c8c2702f95d106d00b977b8"' :
                                            'id="xs-components-links-module-AppModule-7a8f072dec91141a7767920e53fc99acfc1dd760395b55874cec95dd0324ddf6383c56e5370f392e12d64fae54768ccb84b55fa83c8c2702f95d106d00b977b8"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ApplicationLoadingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ApplicationLoadingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UiComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UiComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-7a8f072dec91141a7767920e53fc99acfc1dd760395b55874cec95dd0324ddf6383c56e5370f392e12d64fae54768ccb84b55fa83c8c2702f95d106d00b977b8"' : 'data-bs-target="#xs-injectables-links-module-AppModule-7a8f072dec91141a7767920e53fc99acfc1dd760395b55874cec95dd0324ddf6383c56e5370f392e12d64fae54768ccb84b55fa83c8c2702f95d106d00b977b8"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-7a8f072dec91141a7767920e53fc99acfc1dd760395b55874cec95dd0324ddf6383c56e5370f392e12d64fae54768ccb84b55fa83c8c2702f95d106d00b977b8"' :
                                        'id="xs-injectables-links-module-AppModule-7a8f072dec91141a7767920e53fc99acfc1dd760395b55874cec95dd0324ddf6383c56e5370f392e12d64fae54768ccb84b55fa83c8c2702f95d106d00b977b8"' }>
                                        <li class="link">
                                            <a href="injectables/AnalyticsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AnalyticsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/NotificationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AttendanceModule.html" data-type="entity-link" >AttendanceModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/BirthdayDashboardWidgetModule.html" data-type="entity-link" >BirthdayDashboardWidgetModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ChildrenModule.html" data-type="entity-link" >ChildrenModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ConfigSetupModule.html" data-type="entity-link" >ConfigSetupModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ConfigurableEnumModule.html" data-type="entity-link" >ConfigurableEnumModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ConflictResolutionModule.html" data-type="entity-link" >ConflictResolutionModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/CoreModule.html" data-type="entity-link" >CoreModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CoreModule-3cc74fbd210e3ef47c7dd0793b8f9c585355794a3e5dc6881caf68858f70558919e4c3da96db1cb72e243387e2e7fad77cc048e19805f9337a0b62a2cf423435"' : 'data-bs-target="#xs-injectables-links-module-CoreModule-3cc74fbd210e3ef47c7dd0793b8f9c585355794a3e5dc6881caf68858f70558919e4c3da96db1cb72e243387e2e7fad77cc048e19805f9337a0b62a2cf423435"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CoreModule-3cc74fbd210e3ef47c7dd0793b8f9c585355794a3e5dc6881caf68858f70558919e4c3da96db1cb72e243387e2e7fad77cc048e19805f9337a0b62a2cf423435"' :
                                        'id="xs-injectables-links-module-CoreModule-3cc74fbd210e3ef47c7dd0793b8f9c585355794a3e5dc6881caf68858f70558919e4c3da96db1cb72e243387e2e7fad77cc048e19805f9337a0b62a2cf423435"' }>
                                        <li class="link">
                                            <a href="injectables/CurrentUserSubject.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CurrentUserSubject</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SessionSubject.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SessionSubject</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CoreTestingModule.html" data-type="entity-link" >CoreTestingModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CoreTestingModule-512ae1549c7453d821e60815e7aafa04c72a08c82004ab9d53acf6a9569624667d8a4686556467fced2f5503ab7d6744f1e28fc089b6965422bda66cf87021e0"' : 'data-bs-target="#xs-injectables-links-module-CoreTestingModule-512ae1549c7453d821e60815e7aafa04c72a08c82004ab9d53acf6a9569624667d8a4686556467fced2f5503ab7d6744f1e28fc089b6965422bda66cf87021e0"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CoreTestingModule-512ae1549c7453d821e60815e7aafa04c72a08c82004ab9d53acf6a9569624667d8a4686556467fced2f5503ab7d6744f1e28fc089b6965422bda66cf87021e0"' :
                                        'id="xs-injectables-links-module-CoreTestingModule-512ae1549c7453d821e60815e7aafa04c72a08c82004ab9d53acf6a9569624667d8a4686556467fced2f5503ab7d6744f1e28fc089b6965422bda66cf87021e0"' }>
                                        <li class="link">
                                            <a href="injectables/EntityAbility.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EntityAbility</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/EntitySchemaService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EntitySchemaService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DatabaseTestingModule.html" data-type="entity-link" >DatabaseTestingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/DeDuplicationModule.html" data-type="entity-link" >DeDuplicationModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/DemoDataModule.html" data-type="entity-link" >DemoDataModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-DemoDataModule-040ee274ace1e6b7f12e4e654c0669274340efb0cfc799e626d932bef84090571cc91a92a208ea78b0b1c4dcb2fcf92738b1fa16629f84c84e5b6075725efcaa"' : 'data-bs-target="#xs-components-links-module-DemoDataModule-040ee274ace1e6b7f12e4e654c0669274340efb0cfc799e626d932bef84090571cc91a92a208ea78b0b1c4dcb2fcf92738b1fa16629f84c84e5b6075725efcaa"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-DemoDataModule-040ee274ace1e6b7f12e4e654c0669274340efb0cfc799e626d932bef84090571cc91a92a208ea78b0b1c4dcb2fcf92738b1fa16629f84c84e5b6075725efcaa"' :
                                            'id="xs-components-links-module-DemoDataModule-040ee274ace1e6b7f12e4e654c0669274340efb0cfc799e626d932bef84090571cc91a92a208ea78b0b1c4dcb2fcf92738b1fa16629f84c84e5b6075725efcaa"' }>
                                            <li class="link">
                                                <a href="components/DemoDataGeneratingProgressDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DemoDataGeneratingProgressDialogComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DemoDataModule-040ee274ace1e6b7f12e4e654c0669274340efb0cfc799e626d932bef84090571cc91a92a208ea78b0b1c4dcb2fcf92738b1fa16629f84c84e5b6075725efcaa"' : 'data-bs-target="#xs-injectables-links-module-DemoDataModule-040ee274ace1e6b7f12e4e654c0669274340efb0cfc799e626d932bef84090571cc91a92a208ea78b0b1c4dcb2fcf92738b1fa16629f84c84e5b6075725efcaa"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DemoDataModule-040ee274ace1e6b7f12e4e654c0669274340efb0cfc799e626d932bef84090571cc91a92a208ea78b0b1c4dcb2fcf92738b1fa16629f84c84e5b6075725efcaa"' :
                                        'id="xs-injectables-links-module-DemoDataModule-040ee274ace1e6b7f12e4e654c0669274340efb0cfc799e626d932bef84090571cc91a92a208ea78b0b1c4dcb2fcf92738b1fa16629f84c84e5b6075725efcaa"' }>
                                        <li class="link">
                                            <a href="injectables/DemoDataInitializerService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DemoDataInitializerService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DemoDataService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DemoDataService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/EntityCountDashboardWidgetModule.html" data-type="entity-link" >EntityCountDashboardWidgetModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/FileModule.html" data-type="entity-link" >FileModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FileModule-1178cf6ade80b283fb1b9203315ed0fcb1ce34375e119c883931207454c65b6337085dde7f793b52c9cc8afaea1ec8fcb7b6646c233f57eaa2b0a46e656542ee"' : 'data-bs-target="#xs-injectables-links-module-FileModule-1178cf6ade80b283fb1b9203315ed0fcb1ce34375e119c883931207454c65b6337085dde7f793b52c9cc8afaea1ec8fcb7b6646c233f57eaa2b0a46e656542ee"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FileModule-1178cf6ade80b283fb1b9203315ed0fcb1ce34375e119c883931207454c65b6337085dde7f793b52c9cc8afaea1ec8fcb7b6646c233f57eaa2b0a46e656542ee"' :
                                        'id="xs-injectables-links-module-FileModule-1178cf6ade80b283fb1b9203315ed0fcb1ce34375e119c883931207454c65b6337085dde7f793b52c9cc8afaea1ec8fcb7b6646c233f57eaa2b0a46e656542ee"' }>
                                        <li class="link">
                                            <a href="injectables/CouchdbFileService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CouchdbFileService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/MockFileService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MockFileService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ImportModule.html" data-type="entity-link" >ImportModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ImportModule-de0df5fe74d74595e32fadd2f9895df7e060e97f8fddefef312581d20d5454263b5367389ca929cc7210ac1ee4b49ad058bde6cf2d22e57d8af2579aa8f4c6ac"' : 'data-bs-target="#xs-components-links-module-ImportModule-de0df5fe74d74595e32fadd2f9895df7e060e97f8fddefef312581d20d5454263b5367389ca929cc7210ac1ee4b49ad058bde6cf2d22e57d8af2579aa8f4c6ac"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ImportModule-de0df5fe74d74595e32fadd2f9895df7e060e97f8fddefef312581d20d5454263b5367389ca929cc7210ac1ee4b49ad058bde6cf2d22e57d8af2579aa8f4c6ac"' :
                                            'id="xs-components-links-module-ImportModule-de0df5fe74d74595e32fadd2f9895df7e060e97f8fddefef312581d20d5454263b5367389ca929cc7210ac1ee4b49ad058bde6cf2d22e57d8af2579aa8f4c6ac"' }>
                                            <li class="link">
                                                <a href="components/DiscreteImportConfigComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DiscreteImportConfigComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LanguageModule.html" data-type="entity-link" >LanguageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/LatestChangesModule.html" data-type="entity-link" >LatestChangesModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/LocationModule.html" data-type="entity-link" >LocationModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/MarkdownPageModule.html" data-type="entity-link" >MarkdownPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/MatchingEntitiesModule.html" data-type="entity-link" >MatchingEntitiesModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/MockedTestingModule.html" data-type="entity-link" >MockedTestingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/NotesModule.html" data-type="entity-link" >NotesModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/PermissionsModule.html" data-type="entity-link" >PermissionsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PermissionsModule-2c872fecaaba09bb63a72263158f46ea1c5fc80c37118613d34c7b9564813d40629f95ecce67c358349e5b5b7d546c6b892d2aef9820063323d85cb53f51a891"' : 'data-bs-target="#xs-injectables-links-module-PermissionsModule-2c872fecaaba09bb63a72263158f46ea1c5fc80c37118613d34c7b9564813d40629f95ecce67c358349e5b5b7d546c6b892d2aef9820063323d85cb53f51a891"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PermissionsModule-2c872fecaaba09bb63a72263158f46ea1c5fc80c37118613d34c7b9564813d40629f95ecce67c358349e5b5b7d546c6b892d2aef9820063323d85cb53f51a891"' :
                                        'id="xs-injectables-links-module-PermissionsModule-2c872fecaaba09bb63a72263158f46ea1c5fc80c37118613d34c7b9564813d40629f95ecce67c358349e5b5b7d546c6b892d2aef9820063323d85cb53f51a891"' }>
                                        <li class="link">
                                            <a href="injectables/AbilityService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AbilityService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/EntityAbility.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EntityAbility</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRoleGuard.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRoleGuard</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProgressDashboardWidgetModule.html" data-type="entity-link" >ProgressDashboardWidgetModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/PublicFormModule.html" data-type="entity-link" >PublicFormModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ReportingModule.html" data-type="entity-link" >ReportingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SessionModule.html" data-type="entity-link" >SessionModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SessionModule-1a365e63d4564af1b72f607735762097af64f29a4caa0c130a52c08f278edad85ae4bd7abe1a8fa3a73b38421dbca4dd3454a5313c3e450ded8b0fac71e71726"' : 'data-bs-target="#xs-injectables-links-module-SessionModule-1a365e63d4564af1b72f607735762097af64f29a4caa0c130a52c08f278edad85ae4bd7abe1a8fa3a73b38421dbca4dd3454a5313c3e450ded8b0fac71e71726"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SessionModule-1a365e63d4564af1b72f607735762097af64f29a4caa0c130a52c08f278edad85ae4bd7abe1a8fa3a73b38421dbca4dd3454a5313c3e450ded8b0fac71e71726"' :
                                        'id="xs-injectables-links-module-SessionModule-1a365e63d4564af1b72f607735762097af64f29a4caa0c130a52c08f278edad85ae4bd7abe1a8fa3a73b38421dbca4dd3454a5313c3e450ded8b0fac71e71726"' }>
                                        <li class="link">
                                            <a href="injectables/KeycloakAuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeycloakAuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LoginStateSubject.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginStateSubject</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SessionManagerService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SessionManagerService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SyncStateSubject.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SyncStateSubject</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ShortcutDashboardWidgetModule.html" data-type="entity-link" >ShortcutDashboardWidgetModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SkillModule.html" data-type="entity-link" >SkillModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/StorybookBaseModule.html" data-type="entity-link" >StorybookBaseModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/TabStateModule.html" data-type="entity-link" >TabStateModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#directives-links-module-TabStateModule-0540cf9faa31c31929e64865bc3b946450cae36ec472d04a01c3ab4c0fdfb4939fd95b7b3e98f89eb2824ebfe763d29ecd9fe2c438c382551055b0cdfe219d49"' : 'data-bs-target="#xs-directives-links-module-TabStateModule-0540cf9faa31c31929e64865bc3b946450cae36ec472d04a01c3ab4c0fdfb4939fd95b7b3e98f89eb2824ebfe763d29ecd9fe2c438c382551055b0cdfe219d49"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-TabStateModule-0540cf9faa31c31929e64865bc3b946450cae36ec472d04a01c3ab4c0fdfb4939fd95b7b3e98f89eb2824ebfe763d29ecd9fe2c438c382551055b0cdfe219d49"' :
                                        'id="xs-directives-links-module-TabStateModule-0540cf9faa31c31929e64865bc3b946450cae36ec472d04a01c3ab4c0fdfb4939fd95b7b3e98f89eb2824ebfe763d29ecd9fe2c438c382551055b0cdfe219d49"' }>
                                        <li class="link">
                                            <a href="directives/TabStateMemoDirective.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TabStateMemoDirective</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TemplateExportModule.html" data-type="entity-link" >TemplateExportModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/TodosModule.html" data-type="entity-link" >TodosModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AccountPageComponent.html" data-type="entity-link" >AccountPageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActivitiesOverviewComponent.html" data-type="entity-link" class="deprecated-name">ActivitiesOverviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActivityAttendanceSectionComponent.html" data-type="entity-link" >ActivityAttendanceSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActivityCardComponent.html" data-type="entity-link" >ActivityCardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AddDayAttendanceComponent.html" data-type="entity-link" >AddDayAttendanceComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AddressEditComponent.html" data-type="entity-link" >AddressEditComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AddressGpsLocationComponent.html" data-type="entity-link" >AddressGpsLocationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AddressSearchComponent.html" data-type="entity-link" >AddressSearchComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminEditDescriptionOnlyFieldComponent.html" data-type="entity-link" >AdminEditDescriptionOnlyFieldComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminEntityComponent.html" data-type="entity-link" >AdminEntityComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminEntityDetailsComponent.html" data-type="entity-link" >AdminEntityDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminEntityFieldComponent.html" data-type="entity-link" >AdminEntityFieldComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminEntityFormComponent.html" data-type="entity-link" >AdminEntityFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminEntityGeneralSettingsComponent.html" data-type="entity-link" >AdminEntityGeneralSettingsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminEntityListComponent.html" data-type="entity-link" >AdminEntityListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminEntityPanelComponentComponent.html" data-type="entity-link" >AdminEntityPanelComponentComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminEntityPublicFormsComponent.html" data-type="entity-link" >AdminEntityPublicFormsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminEntityTypesComponent.html" data-type="entity-link" >AdminEntityTypesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminOverviewComponent.html" data-type="entity-link" >AdminOverviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminSectionHeaderComponent.html" data-type="entity-link" >AdminSectionHeaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AdminTabsComponent.html" data-type="entity-link" >AdminTabsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AlertStoriesHelperComponent.html" data-type="entity-link" >AlertStoriesHelperComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AnonymizeOptionsComponent.html" data-type="entity-link" >AnonymizeOptionsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationLoadingComponent.html" data-type="entity-link" >ApplicationLoadingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppVersionComponent.html" data-type="entity-link" >AppVersionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AttendanceBlockComponent.html" data-type="entity-link" >AttendanceBlockComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AttendanceCalendarComponent.html" data-type="entity-link" >AttendanceCalendarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AttendanceDayBlockComponent.html" data-type="entity-link" >AttendanceDayBlockComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AttendanceDetailsComponent.html" data-type="entity-link" >AttendanceDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AttendanceManagerComponent.html" data-type="entity-link" >AttendanceManagerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AttendanceStatusSelectComponent.html" data-type="entity-link" >AttendanceStatusSelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AttendanceSummaryComponent.html" data-type="entity-link" >AttendanceSummaryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AttendanceWeekDashboardComponent.html" data-type="entity-link" >AttendanceWeekDashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BackgroundProcessingIndicatorComponent.html" data-type="entity-link" >BackgroundProcessingIndicatorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BasicAutocompleteComponent.html" data-type="entity-link" >BasicAutocompleteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BetaFeatureComponent.html" data-type="entity-link" >BetaFeatureComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BirthdayDashboardComponent.html" data-type="entity-link" >BirthdayDashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BooleanInputComponent.html" data-type="entity-link" >BooleanInputComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BulkLinkExternalProfilesComponent.html" data-type="entity-link" >BulkLinkExternalProfilesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BulkMergeRecordsComponent.html" data-type="entity-link" >BulkMergeRecordsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ChangelogComponent.html" data-type="entity-link" >ChangelogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ChildSchoolOverviewComponent.html" data-type="entity-link" >ChildSchoolOverviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ComingSoonComponent.html" data-type="entity-link" >ComingSoonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CompareRevComponent.html" data-type="entity-link" >CompareRevComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ConfigImportComponent.html" data-type="entity-link" >ConfigImportComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ConfigureEntityFieldValidatorComponent.html" data-type="entity-link" >ConfigureEntityFieldValidatorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ConfigureEnumPopupComponent.html" data-type="entity-link" >ConfigureEnumPopupComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ConfirmationDialogComponent.html" data-type="entity-link" >ConfirmationDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ConflictResolutionListComponent.html" data-type="entity-link" >ConflictResolutionListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CustomIntervalComponent.html" data-type="entity-link" >CustomIntervalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DashboardComponent.html" data-type="entity-link" >DashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DashboardListWidgetComponent.html" data-type="entity-link" >DashboardListWidgetComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DashboardWidgetComponent.html" data-type="entity-link" >DashboardWidgetComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DateImportConfigComponent.html" data-type="entity-link" >DateImportConfigComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DateRangeFilterComponent.html" data-type="entity-link" >DateRangeFilterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DateRangeFilterPanelComponent.html" data-type="entity-link" >DateRangeFilterPanelComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DefaultValueOptionsComponent.html" data-type="entity-link" >DefaultValueOptionsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DialogButtonsComponent.html" data-type="entity-link" >DialogButtonsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DialogCloseComponent.html" data-type="entity-link" >DialogCloseComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DialogViewComponent.html" data-type="entity-link" >DialogViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisabledWrapperComponent.html" data-type="entity-link" >DisabledWrapperComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DiscreteImportConfigComponent.html" data-type="entity-link" >DiscreteImportConfigComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayAgeComponent.html" data-type="entity-link" >DisplayAgeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayCalculatedValueComponent.html" data-type="entity-link" >DisplayCalculatedValueComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayCheckmarkComponent.html" data-type="entity-link" >DisplayCheckmarkComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayConfigurableEnumComponent.html" data-type="entity-link" >DisplayConfigurableEnumComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayDateComponent.html" data-type="entity-link" >DisplayDateComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayEntityComponent.html" data-type="entity-link" >DisplayEntityComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayEntityTypeComponent.html" data-type="entity-link" >DisplayEntityTypeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayImgComponent.html" data-type="entity-link" >DisplayImgComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayLongTextComponent.html" data-type="entity-link" >DisplayLongTextComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayMonthComponent.html" data-type="entity-link" >DisplayMonthComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayParticipantsCountComponent.html" data-type="entity-link" >DisplayParticipantsCountComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayPercentageComponent.html" data-type="entity-link" >DisplayPercentageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayRecurringIntervalComponent.html" data-type="entity-link" >DisplayRecurringIntervalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayTextComponent.html" data-type="entity-link" >DisplayTextComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayTodoCompletionComponent.html" data-type="entity-link" >DisplayTodoCompletionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayUnitComponent.html" data-type="entity-link" >DisplayUnitComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DisplayUrlComponent.html" data-type="entity-link" >DisplayUrlComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditAgeComponent.html" data-type="entity-link" >EditAgeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditAttendanceComponent.html" data-type="entity-link" >EditAttendanceComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditBooleanComponent.html" data-type="entity-link" >EditBooleanComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditConfigurableEnumComponent.html" data-type="entity-link" >EditConfigurableEnumComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditDateComponent.html" data-type="entity-link" >EditDateComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditDescriptionOnlyComponent.html" data-type="entity-link" >EditDescriptionOnlyComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditEntityComponent.html" data-type="entity-link" >EditEntityComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditEntityTypeComponent.html" data-type="entity-link" >EditEntityTypeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditExternalProfileLinkComponent.html" data-type="entity-link" >EditExternalProfileLinkComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditFileComponent.html" data-type="entity-link" >EditFileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditImportColumnMappingComponent.html" data-type="entity-link" >EditImportColumnMappingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditLocationComponent.html" data-type="entity-link" >EditLocationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditLongTextComponent.html" data-type="entity-link" >EditLongTextComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditMonthComponent.html" data-type="entity-link" >EditMonthComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditNumberComponent.html" data-type="entity-link" >EditNumberComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditPhotoComponent.html" data-type="entity-link" >EditPhotoComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditPrefilledValuesComponent.html" data-type="entity-link" >EditPrefilledValuesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditProgressDashboardComponent.html" data-type="entity-link" >EditProgressDashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditPublicFormColumnsComponent.html" data-type="entity-link" >EditPublicFormColumnsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditPublicformRouteComponent.html" data-type="entity-link" >EditPublicformRouteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditRecurringIntervalComponent.html" data-type="entity-link" >EditRecurringIntervalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditTemplateExportFileComponent.html" data-type="entity-link" >EditTemplateExportFileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditTextComponent.html" data-type="entity-link" >EditTextComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditTextWithAutocompleteComponent.html" data-type="entity-link" >EditTextWithAutocompleteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditUrlComponent.html" data-type="entity-link" >EditUrlComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntitiesTableComponent.html" data-type="entity-link" >EntitiesTableComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityActionsMenuComponent.html" data-type="entity-link" >EntityActionsMenuComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityArchivedInfoComponent.html" data-type="entity-link" >EntityArchivedInfoComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityBlockComponent.html" data-type="entity-link" >EntityBlockComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityBulkEditComponent.html" data-type="entity-link" >EntityBulkEditComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityCountDashboardComponent.html" data-type="entity-link" >EntityCountDashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityCreateButtonComponent.html" data-type="entity-link" >EntityCreateButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityDetailsComponent.html" data-type="entity-link" >EntityDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityFieldEditComponent.html" data-type="entity-link" >EntityFieldEditComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityFieldLabelComponent.html" data-type="entity-link" >EntityFieldLabelComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityFieldSelectComponent.html" data-type="entity-link" >EntityFieldSelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityFieldsMenuComponent.html" data-type="entity-link" >EntityFieldsMenuComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityFieldViewComponent.html" data-type="entity-link" >EntityFieldViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityFormComponent.html" data-type="entity-link" >EntityFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityImportConfigComponent.html" data-type="entity-link" >EntityImportConfigComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityInlineEditActionsComponent.html" data-type="entity-link" >EntityInlineEditActionsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityListComponent.html" data-type="entity-link" >EntityListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntitySelectComponent.html" data-type="entity-link" >EntitySelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityTypeSelectComponent.html" data-type="entity-link" >EntityTypeSelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EnumDropdownComponent.html" data-type="entity-link" >EnumDropdownComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ErrorHintComponent.html" data-type="entity-link" >ErrorHintComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FaDynamicIconComponent.html" data-type="entity-link" >FaDynamicIconComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FilterComponent.html" data-type="entity-link" >FilterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FilterOverlayComponent.html" data-type="entity-link" >FilterOverlayComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FormComponent.html" data-type="entity-link" >FormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/GroupedChildAttendanceComponent.html" data-type="entity-link" >GroupedChildAttendanceComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HelpButtonComponent.html" data-type="entity-link" >HelpButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImagePopupComponent.html" data-type="entity-link" >ImagePopupComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportAdditionalActionsComponent.html" data-type="entity-link" >ImportAdditionalActionsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportantNotesDashboardComponent.html" data-type="entity-link" >ImportantNotesDashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportColumnMappingComponent.html" data-type="entity-link" >ImportColumnMappingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportComponent.html" data-type="entity-link" >ImportComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportConfirmSummaryComponent.html" data-type="entity-link" >ImportConfirmSummaryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportEntityTypeComponent.html" data-type="entity-link" >ImportEntityTypeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportFileComponent.html" data-type="entity-link" >ImportFileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportHistoryComponent.html" data-type="entity-link" >ImportHistoryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportMatchExistingComponent.html" data-type="entity-link" >ImportMatchExistingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportReviewDataComponent.html" data-type="entity-link" >ImportReviewDataComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InheritedValueButtonComponent.html" data-type="entity-link" >InheritedValueButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InputFileComponent.html" data-type="entity-link" >InputFileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/JsonEditorComponent.html" data-type="entity-link" >JsonEditorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/JsonEditorDialogComponent.html" data-type="entity-link" >JsonEditorDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LanguageSelectComponent.html" data-type="entity-link" >LanguageSelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LinkExternalProfileDialogComponent.html" data-type="entity-link" >LinkExternalProfileDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ListFilterComponent.html" data-type="entity-link" >ListFilterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ListPaginatorComponent.html" data-type="entity-link" >ListPaginatorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LocationInputComponent.html" data-type="entity-link" >LocationInputComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginComponent.html" data-type="entity-link" >LoginComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MapComponent.html" data-type="entity-link" >MapComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MapPopupComponent.html" data-type="entity-link" >MapPopupComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MapPropertiesPopupComponent.html" data-type="entity-link" >MapPropertiesPopupComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MarkdownPageComponent.html" data-type="entity-link" >MarkdownPageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MatchingEntitiesComponent.html" data-type="entity-link" >MatchingEntitiesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MenuItemComponent.html" data-type="entity-link" >MenuItemComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MergeFieldsComponent.html" data-type="entity-link" >MergeFieldsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NavigationComponent.html" data-type="entity-link" >NavigationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NoteAttendanceCountBlockComponent.html" data-type="entity-link" >NoteAttendanceCountBlockComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NoteDetailsComponent.html" data-type="entity-link" >NoteDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotesDashboardComponent.html" data-type="entity-link" >NotesDashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotesManagerComponent.html" data-type="entity-link" >NotesManagerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotesRelatedToEntityComponent.html" data-type="entity-link" >NotesRelatedToEntityComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotFoundComponent.html" data-type="entity-link" >NotFoundComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotificationComponent.html" data-type="entity-link" >NotificationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotificationItemComponent.html" data-type="entity-link" >NotificationItemComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotificationRuleComponent.html" data-type="entity-link" >NotificationRuleComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotificationSettingsComponent.html" data-type="entity-link" >NotificationSettingsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ObjectTableComponent.html" data-type="entity-link" >ObjectTableComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PillComponent.html" data-type="entity-link" >PillComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PrimaryActionComponent.html" data-type="entity-link" >PrimaryActionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProgressComponent.html" data-type="entity-link" >ProgressComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProgressDashboardComponent.html" data-type="entity-link" >ProgressDashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProgressDialogComponent.html" data-type="entity-link" >ProgressDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PublicFormComponent.html" data-type="entity-link" >PublicFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PwaInstallComponent.html" data-type="entity-link" >PwaInstallComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReadonlyFunctionComponent.html" data-type="entity-link" >ReadonlyFunctionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RecentAttendanceBlocksComponent.html" data-type="entity-link" >RecentAttendanceBlocksComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RelatedEntitiesComponent.html" data-type="entity-link" >RelatedEntitiesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RelatedEntitiesWithSummaryComponent.html" data-type="entity-link" >RelatedEntitiesWithSummaryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RelatedTimePeriodEntitiesComponent.html" data-type="entity-link" >RelatedTimePeriodEntitiesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportingComponent.html" data-type="entity-link" >ReportingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportRowComponent.html" data-type="entity-link" >ReportRowComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RollCallComponent.html" data-type="entity-link" >RollCallComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RollCallSetupComponent.html" data-type="entity-link" >RollCallSetupComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RollCallTabComponent.html" data-type="entity-link" >RollCallTabComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RoutedViewComponent.html" data-type="entity-link" >RoutedViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RowDetailsComponent.html" data-type="entity-link" >RowDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SearchComponent.html" data-type="entity-link" >SearchComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SelectReportComponent.html" data-type="entity-link" >SelectReportComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SetupWizardButtonComponent.html" data-type="entity-link" >SetupWizardButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SetupWizardComponent.html" data-type="entity-link" >SetupWizardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ShortcutDashboardComponent.html" data-type="entity-link" >ShortcutDashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ShowFileComponent.html" data-type="entity-link" >ShowFileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SqlV2TableComponent.html" data-type="entity-link" >SqlV2TableComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SubmissionSuccessComponent.html" data-type="entity-link" >SubmissionSuccessComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SupportComponent.html" data-type="entity-link" >SupportComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SyncStatusComponent.html" data-type="entity-link" >SyncStatusComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TemplateExportSelectionDialogComponent.html" data-type="entity-link" >TemplateExportSelectionDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TemplateTooltipComponent.html" data-type="entity-link" >TemplateTooltipComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TodoCompletionComponent.html" data-type="entity-link" >TodoCompletionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TodoDetailsComponent.html" data-type="entity-link" >TodoDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TodoListComponent.html" data-type="entity-link" >TodoListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TodosDashboardComponent.html" data-type="entity-link" >TodosDashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TodosRelatedToEntityComponent.html" data-type="entity-link" >TodosRelatedToEntityComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UiComponent.html" data-type="entity-link" >UiComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UserAccountComponent.html" data-type="entity-link" >UserAccountComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UserSecurityComponent.html" data-type="entity-link" >UserSecurityComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ViewActionsComponent.html" data-type="entity-link" >ViewActionsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ViewDistanceComponent.html" data-type="entity-link" >ViewDistanceComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ViewFileComponent.html" data-type="entity-link" >ViewFileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ViewLocationComponent.html" data-type="entity-link" >ViewLocationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ViewTitleComponent.html" data-type="entity-link" >ViewTitleComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WidgetContentComponent.html" data-type="entity-link" >WidgetContentComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#directives-links"' :
                                'data-bs-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/AbstractEntityDetailsComponent.html" data-type="entity-link" >AbstractEntityDetailsComponent</a>
                                </li>
                                <li class="link">
                                    <a href="directives/AdminTabTemplateDirective.html" data-type="entity-link" >AdminTabTemplateDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/BorderHighlightDirective.html" data-type="entity-link" >BorderHighlightDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/ConfigurableEnumDirective.html" data-type="entity-link" >ConfigurableEnumDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/CustomFormControlDirective.html" data-type="entity-link" >CustomFormControlDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/DisableEntityOperationDirective.html" data-type="entity-link" >DisableEntityOperationDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/DynamicComponentDirective.html" data-type="entity-link" >DynamicComponentDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/EditComponent.html" data-type="entity-link" >EditComponent</a>
                                </li>
                                <li class="link">
                                    <a href="directives/ExportDataDirective.html" data-type="entity-link" >ExportDataDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/TemplateTooltipDirective.html" data-type="entity-link" >TemplateTooltipDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/ViewDirective.html" data-type="entity-link" >ViewDirective</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AbstractViewComponent.html" data-type="entity-link" >AbstractViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="classes/ActivityAttendance.html" data-type="entity-link" >ActivityAttendance</a>
                            </li>
                            <li class="link">
                                <a href="classes/BooleanFilter.html" data-type="entity-link" >BooleanFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/CascadingActionResult.html" data-type="entity-link" >CascadingActionResult</a>
                            </li>
                            <li class="link">
                                <a href="classes/CascadingEntityAction.html" data-type="entity-link" >CascadingEntityAction</a>
                            </li>
                            <li class="link">
                                <a href="classes/Changelog.html" data-type="entity-link" >Changelog</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChildSchoolRelation.html" data-type="entity-link" >ChildSchoolRelation</a>
                            </li>
                            <li class="link">
                                <a href="classes/ComponentRegistry.html" data-type="entity-link" >ComponentRegistry</a>
                            </li>
                            <li class="link">
                                <a href="classes/Config.html" data-type="entity-link" >Config</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConfigurableEnum.html" data-type="entity-link" >ConfigurableEnum</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConfigurableEnumFilter.html" data-type="entity-link" >ConfigurableEnumFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomFaker.html" data-type="entity-link" >CustomFaker</a>
                            </li>
                            <li class="link">
                                <a href="classes/DashboardWidget.html" data-type="entity-link" >DashboardWidget</a>
                            </li>
                            <li class="link">
                                <a href="classes/Database.html" data-type="entity-link" >Database</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatabaseException.html" data-type="entity-link" >DatabaseException</a>
                            </li>
                            <li class="link">
                                <a href="classes/DateFilter.html" data-type="entity-link" >DateFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/DateWithAge.html" data-type="entity-link" >DateWithAge</a>
                            </li>
                            <li class="link">
                                <a href="classes/DefaultDatatype.html" data-type="entity-link" >DefaultDatatype</a>
                            </li>
                            <li class="link">
                                <a href="classes/DefaultValueStrategy.html" data-type="entity-link" >DefaultValueStrategy</a>
                            </li>
                            <li class="link">
                                <a href="classes/DemoChildConfig.html" data-type="entity-link" >DemoChildConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/DemoDataGenerator.html" data-type="entity-link" >DemoDataGenerator</a>
                            </li>
                            <li class="link">
                                <a href="classes/DemoDataServiceConfig.html" data-type="entity-link" >DemoDataServiceConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/DemoEducationMaterialConfig.html" data-type="entity-link" >DemoEducationMaterialConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/DemoEventsConfig.html" data-type="entity-link" >DemoEventsConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/DemoHistoricalDataConfig.html" data-type="entity-link" >DemoHistoricalDataConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/DemoNoteConfig.html" data-type="entity-link" >DemoNoteConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/DemoSchoolConfig.html" data-type="entity-link" >DemoSchoolConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/DemoTodoConfig.html" data-type="entity-link" >DemoTodoConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/DiscreteDatatype.html" data-type="entity-link" >DiscreteDatatype</a>
                            </li>
                            <li class="link">
                                <a href="classes/DuplicateEnumOptionException.html" data-type="entity-link" >DuplicateEnumOptionException</a>
                            </li>
                            <li class="link">
                                <a href="classes/Entity.html" data-type="entity-link" >Entity</a>
                            </li>
                            <li class="link">
                                <a href="classes/EntityFilter.html" data-type="entity-link" >EntityFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/EntityRegistry.html" data-type="entity-link" >EntityRegistry</a>
                            </li>
                            <li class="link">
                                <a href="classes/EventAttendance.html" data-type="entity-link" >EventAttendance</a>
                            </li>
                            <li class="link">
                                <a href="classes/EventAttendanceMap.html" data-type="entity-link" >EventAttendanceMap</a>
                            </li>
                            <li class="link">
                                <a href="classes/EventNote.html" data-type="entity-link" >EventNote</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileService.html" data-type="entity-link" >FileService</a>
                            </li>
                            <li class="link">
                                <a href="classes/Filter.html" data-type="entity-link" >Filter</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportMetadata.html" data-type="entity-link" >ImportMetadata</a>
                            </li>
                            <li class="link">
                                <a href="classes/InvalidFormFieldError.html" data-type="entity-link" >InvalidFormFieldError</a>
                            </li>
                            <li class="link">
                                <a href="classes/LatestEntityLoader.html" data-type="entity-link" >LatestEntityLoader</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoggingService.html" data-type="entity-link" >LoggingService</a>
                            </li>
                            <li class="link">
                                <a href="classes/MarkdownContent.html" data-type="entity-link" >MarkdownContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/MarkedRendererCustom.html" data-type="entity-link" >MarkedRendererCustom</a>
                            </li>
                            <li class="link">
                                <a href="classes/MemoryPouchDatabase.html" data-type="entity-link" >MemoryPouchDatabase</a>
                            </li>
                            <li class="link">
                                <a href="classes/MockEntityMapperService.html" data-type="entity-link" >MockEntityMapperService</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotAvailableOfflineError.html" data-type="entity-link" >NotAvailableOfflineError</a>
                            </li>
                            <li class="link">
                                <a href="classes/Note.html" data-type="entity-link" >Note</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotificationConfig.html" data-type="entity-link" >NotificationConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotificationEvent.html" data-type="entity-link" >NotificationEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotificationRule.html" data-type="entity-link" >NotificationRule</a>
                            </li>
                            <li class="link">
                                <a href="classes/ObservableMatchersImpl.html" data-type="entity-link" >ObservableMatchersImpl</a>
                            </li>
                            <li class="link">
                                <a href="classes/ObservableQueue.html" data-type="entity-link" >ObservableQueue</a>
                            </li>
                            <li class="link">
                                <a href="classes/PouchDatabase.html" data-type="entity-link" >PouchDatabase</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProgressDashboardConfig.html" data-type="entity-link" >ProgressDashboardConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/PublicFormConfig.html" data-type="entity-link" >PublicFormConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/QueryDataSource.html" data-type="entity-link" >QueryDataSource</a>
                            </li>
                            <li class="link">
                                <a href="classes/RecurringActivity.html" data-type="entity-link" >RecurringActivity</a>
                            </li>
                            <li class="link">
                                <a href="classes/Registry.html" data-type="entity-link" >Registry</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemoteLoginNotAvailableError.html" data-type="entity-link" >RemoteLoginNotAvailableError</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemotePouchDatabase.html" data-type="entity-link" >RemotePouchDatabase</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReportConfig.html" data-type="entity-link" >ReportConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchemaEmbedDatatype.html" data-type="entity-link" >SchemaEmbedDatatype</a>
                            </li>
                            <li class="link">
                                <a href="classes/SelectableFilter.html" data-type="entity-link" >SelectableFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/SiteSettings.html" data-type="entity-link" >SiteSettings</a>
                            </li>
                            <li class="link">
                                <a href="classes/Skill.html" data-type="entity-link" >Skill</a>
                            </li>
                            <li class="link">
                                <a href="classes/SqsSchema.html" data-type="entity-link" >SqsSchema</a>
                            </li>
                            <li class="link">
                                <a href="classes/SyncedPouchDatabase.html" data-type="entity-link" >SyncedPouchDatabase</a>
                            </li>
                            <li class="link">
                                <a href="classes/TemplateExport.html" data-type="entity-link" >TemplateExport</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestEntity.html" data-type="entity-link" >TestEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimeInterval.html" data-type="entity-link" >TimeInterval</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimeIntervalDatatype.html" data-type="entity-link" >TimeIntervalDatatype</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimePeriod.html" data-type="entity-link" >TimePeriod</a>
                            </li>
                            <li class="link">
                                <a href="classes/Todo.html" data-type="entity-link" >Todo</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateMetadata.html" data-type="entity-link" >UpdateMetadata</a>
                            </li>
                            <li class="link">
                                <a href="classes/ViewComponentContext.html" data-type="entity-link" >ViewComponentContext</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AdminEntityService.html" data-type="entity-link" >AdminEntityService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AdminOverviewService.html" data-type="entity-link" >AdminOverviewService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AlertService.html" data-type="entity-link" >AlertService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AttendanceService.html" data-type="entity-link" >AttendanceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AutoResolutionService.html" data-type="entity-link" >AutoResolutionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BackupService.html" data-type="entity-link" >BackupService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BooleanDatatype.html" data-type="entity-link" >BooleanDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BulkMergeService.html" data-type="entity-link" >BulkMergeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ChildrenService.html" data-type="entity-link" >ChildrenService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ComingSoonDialogService.html" data-type="entity-link" >ComingSoonDialogService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ConfigImportParserService.html" data-type="entity-link" >ConfigImportParserService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ConfigService.html" data-type="entity-link" >ConfigService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ConfigurableEnumDatatype.html" data-type="entity-link" >ConfigurableEnumDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ConfigurableEnumService.html" data-type="entity-link" >ConfigurableEnumService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ConfirmationDialogService.html" data-type="entity-link" >ConfirmationDialogService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DataAggregationService.html" data-type="entity-link" >DataAggregationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DatabaseFactoryService.html" data-type="entity-link" >DatabaseFactoryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DatabaseIndexingService.html" data-type="entity-link" >DatabaseIndexingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DatabaseResolverService.html" data-type="entity-link" >DatabaseResolverService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DataTransformationService.html" data-type="entity-link" >DataTransformationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DateAdapterWithFormatting.html" data-type="entity-link" >DateAdapterWithFormatting</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DateDatatype.html" data-type="entity-link" >DateDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DateOnlyDatatype.html" data-type="entity-link" >DateOnlyDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DateWithAgeDatatype.html" data-type="entity-link" >DateWithAgeDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DefaultValueService.html" data-type="entity-link" >DefaultValueService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoActivityEventsGeneratorService.html" data-type="entity-link" >DemoActivityEventsGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoActivityGeneratorService.html" data-type="entity-link" >DemoActivityGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoAserGeneratorService.html" data-type="entity-link" >DemoAserGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoChildGenerator.html" data-type="entity-link" >DemoChildGenerator</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoChildSchoolRelationGenerator.html" data-type="entity-link" >DemoChildSchoolRelationGenerator</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoConfigGeneratorService.html" data-type="entity-link" >DemoConfigGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoConfigurableEnumGeneratorService.html" data-type="entity-link" >DemoConfigurableEnumGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoEducationalMaterialGeneratorService.html" data-type="entity-link" >DemoEducationalMaterialGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoHealthCheckGeneratorService.html" data-type="entity-link" >DemoHealthCheckGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoHistoricalDataGenerator.html" data-type="entity-link" >DemoHistoricalDataGenerator</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoNoteGeneratorService.html" data-type="entity-link" >DemoNoteGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoPermissionGeneratorService.html" data-type="entity-link" >DemoPermissionGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoProgressDashboardWidgetGeneratorService.html" data-type="entity-link" >DemoProgressDashboardWidgetGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoPublicFormGeneratorService.html" data-type="entity-link" >DemoPublicFormGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoReportConfigGeneratorService.html" data-type="entity-link" >DemoReportConfigGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoSchoolGenerator.html" data-type="entity-link" >DemoSchoolGenerator</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoSiteSettingsGeneratorService.html" data-type="entity-link" >DemoSiteSettingsGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoTodoGeneratorService.html" data-type="entity-link" >DemoTodoGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DemoUserGeneratorService.html" data-type="entity-link" >DemoUserGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DownloadService.html" data-type="entity-link" >DownloadService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DuplicateRecordService.html" data-type="entity-link" >DuplicateRecordService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DynamicPlaceholderValueService.html" data-type="entity-link" >DynamicPlaceholderValueService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DynamicValidatorsService.html" data-type="entity-link" >DynamicValidatorsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityActionsMenuService.html" data-type="entity-link" >EntityActionsMenuService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityActionsService.html" data-type="entity-link" >EntityActionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityAnonymizeService.html" data-type="entity-link" >EntityAnonymizeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityConfigService.html" data-type="entity-link" >EntityConfigService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityDatatype.html" data-type="entity-link" >EntityDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityDeleteService.html" data-type="entity-link" >EntityDeleteService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityEditService.html" data-type="entity-link" >EntityEditService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityFormService.html" data-type="entity-link" >EntityFormService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityMapperService.html" data-type="entity-link" >EntityMapperService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntityRelationsService.html" data-type="entity-link" >EntityRelationsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntitySpecialLoaderService.html" data-type="entity-link" >EntitySpecialLoaderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EscoApiService.html" data-type="entity-link" >EscoApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EventAttendanceDatatype.html" data-type="entity-link" class="deprecated-name">EventAttendanceDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EventAttendanceMapDatatype.html" data-type="entity-link" >EventAttendanceMapDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalProfileDatatype.html" data-type="entity-link" >ExternalProfileDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileDatatype.html" data-type="entity-link" >FileDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FilterGeneratorService.html" data-type="entity-link" >FilterGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FilterService.html" data-type="entity-link" >FilterService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FormDialogService.html" data-type="entity-link" >FormDialogService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GeoService.html" data-type="entity-link" >GeoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GpsService.html" data-type="entity-link" >GpsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HistoricalDataService.html" data-type="entity-link" class="deprecated-name">HistoricalDataService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HorizontalHammerConfig.html" data-type="entity-link" >HorizontalHammerConfig</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ImportAdditionalService.html" data-type="entity-link" >ImportAdditionalService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ImportColumnMappingService.html" data-type="entity-link" >ImportColumnMappingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ImportExistingService.html" data-type="entity-link" >ImportExistingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ImportService.html" data-type="entity-link" >ImportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/InheritedValueService.html" data-type="entity-link" >InheritedValueService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LanguageService.html" data-type="entity-link" >LanguageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LatestChangesDialogService.html" data-type="entity-link" >LatestChangesDialogService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LatestChangesService.html" data-type="entity-link" >LatestChangesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocalAuthService.html" data-type="entity-link" >LocalAuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocationDatatype.html" data-type="entity-link" >LocationDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LongTextDatatype.html" data-type="entity-link" >LongTextDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MonthDatatype.html" data-type="entity-link" >MonthDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NumberDatatype.html" data-type="entity-link" >NumberDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PercentageDatatype.html" data-type="entity-link" >PercentageDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PermissionEnforcerService.html" data-type="entity-link" >PermissionEnforcerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PhotoDatatype.html" data-type="entity-link" >PhotoDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PwaInstallService.html" data-type="entity-link" >PwaInstallService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/QueryService.html" data-type="entity-link" >QueryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoutePermissionsService.html" data-type="entity-link" >RoutePermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RouterService.html" data-type="entity-link" >RouterService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ScreenWidthObserver.html" data-type="entity-link" >ScreenWidthObserver</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SearchService.html" data-type="entity-link" >SearchService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SiteSettingsService.html" data-type="entity-link" >SiteSettingsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SkillApiService.html" data-type="entity-link" >SkillApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SqlReportService.html" data-type="entity-link" >SqlReportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StringDatatype.html" data-type="entity-link" >StringDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TemplateExportApiService.html" data-type="entity-link" >TemplateExportApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TemplateExportFileDatatype.html" data-type="entity-link" >TemplateExportFileDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TemplateExportService.html" data-type="entity-link" >TemplateExportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TodoService.html" data-type="entity-link" >TodoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UnsavedChangesService.html" data-type="entity-link" >UnsavedChangesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UpdateManagerService.html" data-type="entity-link" >UpdateManagerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UpdateMetadataDatatype.html" data-type="entity-link" >UpdateMetadataDatatype</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UrlDatatype.html" data-type="entity-link" >UrlDatatype</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interceptors-links"' :
                            'data-bs-target="#xs-interceptors-links"' }>
                            <span class="icon ion-ios-swap"></span>
                            <span>Interceptors</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="interceptors-links"' : 'id="xs-interceptors-links"' }>
                            <li class="link">
                                <a href="interceptors/AcceptLanguageInterceptor.html" data-type="entity-link" >AcceptLanguageInterceptor</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/AbstractPermissionGuard.html" data-type="entity-link" >AbstractPermissionGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/EntityPermissionGuard.html" data-type="entity-link" >EntityPermissionGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AdditionalImportBaseAction.html" data-type="entity-link" >AdditionalImportBaseAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdditionalIndirectLinkAction.html" data-type="entity-link" >AdditionalIndirectLinkAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdditonalDirectLinkAction.html" data-type="entity-link" >AdditonalDirectLinkAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdminTabTemplateContext.html" data-type="entity-link" >AdminTabTemplateContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Aggregation.html" data-type="entity-link" >Aggregation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AggregationReport.html" data-type="entity-link" >AggregationReport</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AlertConfig.html" data-type="entity-link" >AlertConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AttendanceInfo.html" data-type="entity-link" >AttendanceInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AttendanceReport.html" data-type="entity-link" >AttendanceReport</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AttendanceStatusType.html" data-type="entity-link" >AttendanceStatusType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AttendanceWeekRow.html" data-type="entity-link" >AttendanceWeekRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AverageAttendanceStats.html" data-type="entity-link" >AverageAttendanceStats</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BackgroundProcessState.html" data-type="entity-link" >BackgroundProcessState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BasicFilterConfig.html" data-type="entity-link" >BasicFilterConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BirthdayDashboardConfig.html" data-type="entity-link" >BirthdayDashboardConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BooleanFilterConfig.html" data-type="entity-link" >BooleanFilterConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BulkEditAction.html" data-type="entity-link" >BulkEditAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CalculateReportOptions.html" data-type="entity-link" >CalculateReportOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ColumnGroupsConfig.html" data-type="entity-link" >ColumnGroupsConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ColumnMapping.html" data-type="entity-link" >ColumnMapping</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConfigFieldRaw.html" data-type="entity-link" >ConfigFieldRaw</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConfigurableEnumFilterConfig.html" data-type="entity-link" >ConfigurableEnumFilterConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConfigurableEnumValue.html" data-type="entity-link" >ConfigurableEnumValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConfirmationDialogButton.html" data-type="entity-link" >ConfirmationDialogButton</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConfirmationDialogConfig.html" data-type="entity-link" >ConfirmationDialogConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConflictResolutionStrategy.html" data-type="entity-link" >ConflictResolutionStrategy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Coordinates.html" data-type="entity-link" >Coordinates</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DashboardConfig.html" data-type="entity-link" >DashboardConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DatabaseDocChange.html" data-type="entity-link" >DatabaseDocChange</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DatabaseRules.html" data-type="entity-link" >DatabaseRules</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DateRangeFilterConfig.html" data-type="entity-link" >DateRangeFilterConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DateRangeFilterConfigOption.html" data-type="entity-link" >DateRangeFilterConfigOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DefaultValueConfig.html" data-type="entity-link" >DefaultValueConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DetailsComponentData.html" data-type="entity-link" >DetailsComponentData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DialogViewData.html" data-type="entity-link" >DialogViewData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DynamicComponentConfig.html" data-type="entity-link" >DynamicComponentConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EditProgressDashboardComponentData.html" data-type="entity-link" >EditProgressDashboardComponentData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EmptyDefaultValueHint.html" data-type="entity-link" >EmptyDefaultValueHint</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityAction.html" data-type="entity-link" >EntityAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityBlockConfig.html" data-type="entity-link" >EntityBlockConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityConfig.html" data-type="entity-link" >EntityConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityCountDashboardConfig.html" data-type="entity-link" >EntityCountDashboardConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityDetailsConfig.html" data-type="entity-link" >EntityDetailsConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityForm.html" data-type="entity-link" >EntityForm</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityListConfig.html" data-type="entity-link" >EntityListConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityMenuItem.html" data-type="entity-link" >EntityMenuItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityNotificationContext.html" data-type="entity-link" >EntityNotificationContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityPropertyMap.html" data-type="entity-link" >EntityPropertyMap</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntitySchemaField.html" data-type="entity-link" >EntitySchemaField</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityWithBirthday.html" data-type="entity-link" >EntityWithBirthday</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityWithRecentNoteInfo.html" data-type="entity-link" >EntityWithRecentNoteInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EscoSkillDto.html" data-type="entity-link" >EscoSkillDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EscoSkillResponseDto.html" data-type="entity-link" >EscoSkillResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExportColumnConfig.html" data-type="entity-link" >ExportColumnConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExportingReport.html" data-type="entity-link" >ExportingReport</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExportRow.html" data-type="entity-link" >ExportRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExtendedAlertConfig.html" data-type="entity-link" >ExtendedAlertConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalProfile.html" data-type="entity-link" >ExternalProfile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalProfileLinkConfig.html" data-type="entity-link" >ExternalProfileLinkConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalProfileResponseDto.html" data-type="entity-link" >ExternalProfileResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalProfileSearchParams.html" data-type="entity-link" >ExternalProfileSearchParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalSkill.html" data-type="entity-link" >ExternalSkill</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FieldGroup.html" data-type="entity-link" >FieldGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileFieldConfig.html" data-type="entity-link" >FileFieldConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FilterOverlayData.html" data-type="entity-link" >FilterOverlayData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FilterSelectionOption.html" data-type="entity-link" >FilterSelectionOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FirebaseConfiguration.html" data-type="entity-link" >FirebaseConfiguration</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FlattenedReportRow.html" data-type="entity-link" >FlattenedReportRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FormConfig.html" data-type="entity-link" >FormConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FormFieldConfig.html" data-type="entity-link" >FormFieldConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FullDefaultValueHint.html" data-type="entity-link" >FullDefaultValueHint</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GeoLocation.html" data-type="entity-link" >GeoLocation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GeoResult.html" data-type="entity-link" >GeoResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupByDescription.html" data-type="entity-link" >GroupByDescription</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupConfig.html" data-type="entity-link" >GroupConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupCountRow.html" data-type="entity-link" >GroupCountRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HasOrdinal.html" data-type="entity-link" >HasOrdinal</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ImportDataChange.html" data-type="entity-link" >ImportDataChange</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ImportDialogData.html" data-type="entity-link" >ImportDialogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ImportSettings.html" data-type="entity-link" >ImportSettings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InteractionType.html" data-type="entity-link" >InteractionType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KeycloakUserDto.html" data-type="entity-link" >KeycloakUserDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LinkExternalProfileDialogData.html" data-type="entity-link" >LinkExternalProfileDialogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LongTextFieldConfig.html" data-type="entity-link" >LongTextFieldConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MapConfig.html" data-type="entity-link" >MapConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MappingDialogData.html" data-type="entity-link" >MappingDialogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MapPopupConfig.html" data-type="entity-link" >MapPopupConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MarkdownPageConfig.html" data-type="entity-link" >MarkdownPageConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MatchingEntitiesConfig.html" data-type="entity-link" >MatchingEntitiesConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MatchingSide.html" data-type="entity-link" >MatchingSide</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MatchingSideConfig.html" data-type="entity-link" >MatchingSideConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MenuItem.html" data-type="entity-link" >MenuItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NavigationMenuConfig.html" data-type="entity-link" >NavigationMenuConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewMatchAction.html" data-type="entity-link" >NewMatchAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotesDashboardConfig.html" data-type="entity-link" >NotesDashboardConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotesManagerConfig.html" data-type="entity-link" >NotesManagerConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ObservableMatchers.html" data-type="entity-link" >ObservableMatchers</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Panel.html" data-type="entity-link" >Panel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PanelComponent.html" data-type="entity-link" >PanelComponent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PanelConfig.html" data-type="entity-link" >PanelConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParsedData.html" data-type="entity-link" >ParsedData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParsedJWT.html" data-type="entity-link" >ParsedJWT</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PrebuiltFilterConfig.html" data-type="entity-link" >PrebuiltFilterConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PrebuiltFilterConfig-1.html" data-type="entity-link" >PrebuiltFilterConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PrefilledValue.html" data-type="entity-link" >PrefilledValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProgressDashboardPart.html" data-type="entity-link" >ProgressDashboardPart</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecordMatching.html" data-type="entity-link" >RecordMatching</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportCalculation.html" data-type="entity-link" >ReportCalculation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportData.html" data-type="entity-link" >ReportData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportDefinitionDto.html" data-type="entity-link" >ReportDefinitionDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportRow.html" data-type="entity-link" >ReportRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Role.html" data-type="entity-link" >Role</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SelectableOption.html" data-type="entity-link" >SelectableOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SentryBreadcrumbHint.html" data-type="entity-link" >SentryBreadcrumbHint</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SessionInfo.html" data-type="entity-link" >SessionInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SetupWizardConfig.html" data-type="entity-link" >SetupWizardConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SetupWizardStep.html" data-type="entity-link" >SetupWizardStep</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SimpleDropdownValue.html" data-type="entity-link" >SimpleDropdownValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SimpleDropdownValue-1.html" data-type="entity-link" >SimpleDropdownValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SqlReport.html" data-type="entity-link" >SqlReport</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SqlReportRow.html" data-type="entity-link" >SqlReportRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TableRow.html" data-type="entity-link" >TableRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TemplateExportResult.html" data-type="entity-link" >TemplateExportResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TemplateRenderRequestDto.html" data-type="entity-link" >TemplateRenderRequestDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TemplateUploadResponseDto.html" data-type="entity-link" >TemplateUploadResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TodoCompletion.html" data-type="entity-link" >TodoCompletion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdatedEntity.html" data-type="entity-link" >UpdatedEntity</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UsageAnalyticsConfig.html" data-type="entity-link" >UsageAnalyticsConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ViewConfig.html" data-type="entity-link" >ViewConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ViewDistanceConfig.html" data-type="entity-link" >ViewDistanceConfig</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#pipes-links"' :
                                'data-bs-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-add"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/DynamicComponentPipe.html" data-type="entity-link" >DynamicComponentPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/EntityFunctionPipe.html" data-type="entity-link" >EntityFunctionPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/EntityTypeLabelPipe.html" data-type="entity-link" >EntityTypeLabelPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/FlattenArrayPipe.html" data-type="entity-link" >FlattenArrayPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/NotificationTimePipe.html" data-type="entity-link" >NotificationTimePipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
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
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});