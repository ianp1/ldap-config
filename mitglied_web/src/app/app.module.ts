import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatCheckboxModule, MatToolbar, MatToolbarModule, MatSidenavModule, MatIconModule, MatListModule } from '@angular/material';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomNavComponent } from './custom-nav/custom-nav.component';
import { LayoutModule } from '@angular/cdk/layout'

@NgModule({
	declarations: [
		AppComponent,
		CustomNavComponent
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
		MatListModule
	],
	providers: [],
	exports: [
		CustomNavComponent
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
