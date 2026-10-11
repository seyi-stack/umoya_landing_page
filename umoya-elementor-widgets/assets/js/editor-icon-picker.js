/**
 * Icon picker for the Elementor panel (control type `umoya_icon`).
 *
 * Draws a grid of the icons in window.UmoyaIconLibrary for the control's
 * family, marks the one the row uses, and stores the picked icon's drawing as
 * the value. Only library markup is ever put into the panel: a saved value is
 * compared with the library, never inserted, so a value written by someone
 * else cannot run here.
 */
( function ( $ ) {
	'use strict';

	// Two drawings are the same icon when they differ only in spacing.
	function normalise( markup ) {
		return String( markup || '' )
			.replace( /\s+/g, ' ' )
			.replace( />\s+</g, '><' )
			.replace( /\s*\/>/g, '/>' )
			.trim();
	}

	function escapeAttr( text ) {
		return String( text ).replace( /&/g, '&amp;' ).replace( /"/g, '&quot;' ).replace( /</g, '&lt;' );
	}

	$( window ).on( 'elementor:init', function () {
		var BaseData = elementor.modules.controls.BaseData;

		var IconPicker = BaseData.extend( {
			ui: function () {
				var ui = BaseData.prototype.ui.apply( this, arguments );
				ui.grid = '.umoya-icon-picker__grid';
				ui.filter = '.umoya-icon-picker__filter';
				ui.note = '.umoya-icon-picker__note';
				return ui;
			},

			events: function () {
				return _.extend( BaseData.prototype.events.apply( this, arguments ), {
					'click .umoya-icon-picker__item': 'onPick',
					'input @ui.filter': 'onFilter',
				} );
			},

			icons: function () {
				var library = window.UmoyaIconLibrary || {};
				return library[ this.model.get( 'family' ) ] || [];
			},

			// Called on render and whenever the value changes from outside
			// (undo, redo, another panel), in place of filling an input.
			applySavedValue: function () {
				if ( ! this.ui.grid || ! this.ui.grid.length ) {
					return;
				}

				var current = normalise( this.getControlValue() );
				var found = false;
				var html = '';

				_.each( this.icons(), function ( icon, index ) {
					var on = normalise( icon.markup ) === current;
					found = found || on;
					html +=
						'<button type="button" class="umoya-icon-picker__item' + ( on ? ' is-selected' : '' ) + '"' +
						' data-index="' + index + '" title="' + escapeAttr( icon.label ) + '"' +
						' aria-label="' + escapeAttr( icon.label ) + '" aria-pressed="' + ( on ? 'true' : 'false' ) + '">' +
						'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + icon.markup + '</svg>' +
						'</button>';
				} );

				this.ui.grid.html( html );
				this.ui.note.text(
					found || ! current ? '' : 'This row has an icon that is not in this set. Picking one here replaces it.'
				);
				this.onFilter();
			},

			onPick: function ( event ) {
				var icon = this.icons()[ parseInt( event.currentTarget.getAttribute( 'data-index' ), 10 ) ];
				if ( ! icon ) {
					return;
				}
				this.setValue( icon.markup );
				this.applySavedValue();
				// Keep focus on the picked icon for keyboard users.
				this.ui.grid.find( '[data-index="' + event.currentTarget.getAttribute( 'data-index' ) + '"]' ).trigger( 'focus' );
			},

			onFilter: function () {
				var query = ( this.ui.filter.val() || '' ).toLowerCase().trim();
				this.ui.grid.children().each( function () {
					this.hidden = !! query && -1 === this.title.toLowerCase().indexOf( query );
				} );
			},
		} );

		elementor.addControlView( 'umoya_icon', IconPicker );
	} );
}( jQuery ) );
