import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatInputModule, MatCardModule, MatCheckboxModule, MatToolbar, MatToolbarModule, MatSidenavModule, MatIconModule, MatListModule } from '@angular/material';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomNavComponent } from './custom-nav/custom-nav.component';
import { LayoutModule } from '@angular/cdk/layout'

import { RouterModule, Routes } from '@angular/router';
import { EigeneEinweisungenComponent } from './eigene-einweisungen/eigene-einweisungen.component';
import { EinweisungenEintragenComponent } from './einweisungen-eintragen/einweisungen-eintragen.component';
import { MitgliedEintragenComponent } from './mitglied-eintragen/mitglied-eintragen.component';


const appRoutes:Routes = [
	{path: 'eigene-einweisungen', component: EigeneEinweisungenComponent},
	{path: 'einweisungen-eintragen', component: EinweisungenEintragenComponent},
	{path: 'mitglied-eintragen', component: MitgliedEintragenComponent}
];

@NgModule({
	declarations: [
		AppComponent,
		CustomNavComponent,
		EigeneEinweisungenComponent,
		EinweisungenEintragenComponent,
		MitgliedEintragenComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		MatButtonModule,
		MatCheckboxModule,
		NgbModule,
		LayoutModule,
		MatToolbarModule,
		MatSidenavModule,
		MatIconModule,
		MatListModule,
		MatCardModule,
		MatInputModule,
		MatButtonModule,
		RouterModule.forRoot(appRoutes)
	],
	providers: [],
	exports: [
		CustomNavComponent
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
