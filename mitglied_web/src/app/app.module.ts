import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//import { MatAutocomplete, MatSpinner, MatOptionModule, MatSelectModule, MatButtonModule, MatInputModule, MatCardModule, MatCheckboxModule, MatToolbar, MatToolbarModule, MatSidenavModule, MatIconModule, MatListModule } from '@angular/material';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MatRippleModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { UserSearchService } from './user-search/user-search.service';

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
    LoginService,
    UserSearchService
  ],
	exports: [
		CustomNavComponent,
    PlatformModule
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
