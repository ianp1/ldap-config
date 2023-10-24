import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//import { MatAutocomplete, MatSpinner, MatOptionModule, MatSelectModule, MatButtonModule, MatInputModule, MatCardModule, MatCheckboxModule, MatToolbar, MatToolbarModule, MatSidenavModule, MatIconModule, MatListModule } from '@angular/material';

import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatNativeDateModule, MatRippleModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatTreeModule } from '@angular/material/tree';


import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomNavComponent } from './custom-nav/custom-nav.component';
import { LayoutModule } from '@angular/cdk/layout'

import { RouterModule, Routes } from '@angular/router';
import { EigeneEinweisungenComponent } from './eigene-einweisungen/eigene-einweisungen.component';
import { EinweisungenEintragenComponent } from './einweisungen-eintragen/einweisungen-eintragen.component';
import { MitgliedEintragenComponent } from './mitglied-eintragen/mitglied-eintragen.component';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { SicherheitsbelehrungEintragenComponent, DialogUserExisting } from './sicherheitsbelehrung-eintragen/sicherheitsbelehrung-eintragen.component';

import localeDe from '@angular/common/locales/de';
import { registerLocaleData } from '@angular/common';
import { LdapDatePipe } from './ldap-date.pipe';
import { RfidEintragenComponent, DialogRfidExisting } from './rfid-eintragen/rfid-eintragen.component';
import { RfidPruefenComponent } from './rfid-pruefen/rfid-pruefen.component';
import { LoginComponent } from './login/login.component';
import { LoginService } from './login/login.service';

import { UserSearchComponent } from './user-search/user-search.component';

import { ErrorInterceptor, ErrorDialog } from './error-interceptor/error.interceptor';

import { SuccessDialog } from './success-dialog/success-dialog';
import { StartComponent } from './start/start.component';
import { RedirectComponent } from './redirect/redirect.component';
import { ReviewBannerComponent } from './review-banner/review-banner.component';
import { SummaryPageComponent } from './summary-page/summary-page.component';

import { DateAdapter } from '@angular/material/core';
import { GermanDateAdapter } from './GermanDateAdapter';

import {Platform, PlatformModule} from '@angular/cdk/platform';
import { StaffeleinweisungComponent } from './staffeleinweisung/staffeleinweisung.component';
import { MitgliedTeilComponent } from './mitglied-teil/mitglied-teil.component';
import { AbrechnungExportierenComponent } from './abrechnung-exportieren/abrechnung-exportieren.component';
import { MeineDatenComponent } from './meine-daten/meine-daten.component';

const appRoutes:Routes = [
	{path: '', component: RedirectComponent},
  {path: 'start', component: CustomNavComponent}
];

registerLocaleData(localeDe, 'de');

@NgModule({
	declarations: [
		AppComponent,
		CustomNavComponent,
		EigeneEinweisungenComponent,
		EinweisungenEintragenComponent,
		MitgliedEintragenComponent,
		SicherheitsbelehrungEintragenComponent,
    DialogUserExisting,
    ErrorDialog,
    SuccessDialog,
    DialogRfidExisting,
    LdapDatePipe,
    RfidEintragenComponent,
    RfidPruefenComponent,
    LoginComponent,
    UserSearchComponent,
    StartComponent,
    RedirectComponent,
    ReviewBannerComponent,
    SummaryPageComponent,
    StaffeleinweisungComponent,
    MitgliedTeilComponent,
    AbrechnungExportierenComponent,
    MeineDatenComponent
	],
	imports: [
    PlatformModule,
		BrowserModule,
		HttpClientModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		NgbModule,
		LayoutModule,
		ReactiveFormsModule,
    FormsModule,
		MatAutocompleteModule,
    MatBadgeModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatStepperModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatTreeModule,
		RouterModule.forRoot(appRoutes, {})
	],
	providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: DateAdapter, useClass: GermanDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
    LoginService
  ],
	exports: [
		CustomNavComponent,
    PlatformModule
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
