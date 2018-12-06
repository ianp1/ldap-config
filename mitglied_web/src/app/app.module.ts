import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//import { MatAutocomplete, MatSpinner, MatOptionModule, MatSelectModule, MatButtonModule, MatInputModule, MatCardModule, MatCheckboxModule, MatToolbar, MatToolbarModule, MatSidenavModule, MatIconModule, MatListModule } from '@angular/material';

import {
  MatAutocompleteModule,
  MatBadgeModule,
  MatBottomSheetModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
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
  MatStepperModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatTreeModule,
} from '@angular/material';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomNavComponent } from './custom-nav/custom-nav.component';
import { LayoutModule } from '@angular/cdk/layout'

import { RouterModule, Routes } from '@angular/router';
import { EigeneEinweisungenComponent } from './eigene-einweisungen/eigene-einweisungen.component';
import { EinweisungenEintragenComponent } from './einweisungen-eintragen/einweisungen-eintragen.component';
import { MitgliedEintragenComponent } from './mitglied-eintragen/mitglied-eintragen.component';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SicherheitsbelehrungEintragenComponent, DialogUserExisting } from './sicherheitsbelehrung-eintragen/sicherheitsbelehrung-eintragen.component';

import localeDe from '@angular/common/locales/de';
import { registerLocaleData } from '@angular/common';
import { LdapDatePipe } from './ldap-date.pipe';

const appRoutes:Routes = [
	{path: '', component: EigeneEinweisungenComponent},
	{path: 'eigene-einweisungen', component: EigeneEinweisungenComponent},
	{path: 'einweisungen-eintragen', component: EinweisungenEintragenComponent},
	{path: 'mitglied-eintragen', component: MitgliedEintragenComponent},
  {path: 'sicherheitsbelehrung-eintragen', component: SicherheitsbelehrungEintragenComponent}
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
    LdapDatePipe
	],
	imports: [
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
		RouterModule.forRoot(appRoutes)
	],
	providers: [],
	exports: [
		CustomNavComponent
	],
  entryComponents: [
    DialogUserExisting
  ],
	bootstrap: [AppComponent]
})
export class AppModule { }
