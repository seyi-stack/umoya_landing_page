/**
 * Separate a section file into markup, stylesheet and scripts.
 *
 * This lives on its own because two things need to agree on it exactly: the
 * build, which compiles the markup into a template, and the render check, which
 * compares what WordPress served against what the section file says. The
 * homepage sections put their `<style>` block INSIDE the section root, so a
 * check that read the raw file counted the stylesheet as markup and reported
 * every one of them as having lost content. One implementation, no drift.
 */
import { createDocument, outerRange } from './html.mjs';

/**
 * Pull `<style>` and `<script>` blocks out, using parser-reported offsets
 * rather than a regex -- a regex for `<style>` is exactly the failure that ate
 * the footer's opt-out popup (CLAUDE.md phase 21), because it cannot tell a
 * real tag from one named inside a comment.
 *
 * Each block is removed together with the whitespace-only remainder of its own
 * line, so the leftover markup has no orphan blank lines. That trimmed markup is
 * the contract: it is what the compiled template must reproduce exactly.
 *
 * @param {string} raw Section file contents, BOM-stripped and LF-normalised.
 * @return {{markup: string, css: string, scripts: string[]}}
 */
export function splitSection( raw ) {
	const doc = createDocument( raw );
	const styles = [];
	const scripts = [];
	const edits = [];

	for ( const { node } of doc.entries ) {
		const tag = node.tagName.toLowerCase();
		if ( tag !== 'style' && tag !== 'script' ) continue;

		const range = outerRange( node );
		const inner = ( node.childNodes || [] ).map( ( c ) => c.value || '' ).join( '' );
		( tag === 'style' ? styles : scripts ).push( inner.trim() );

		let start = range.start;
		while ( start > 0 && ( raw[ start - 1 ] === ' ' || raw[ start - 1 ] === '\t' ) ) start -= 1;
		let end = range.end;
		while ( end < raw.length && ( raw[ end ] === ' ' || raw[ end ] === '\t' ) ) end += 1;
		if ( raw[ end ] === '\n' ) end += 1;
		if ( start > 0 && raw[ start - 1 ] === '\n' && raw[ end ] === '\n' ) end += 1;

		edits.push( { start, end } );
	}

	let markup = raw;
	for ( const edit of edits.sort( ( a, b ) => b.start - a.start ) ) {
		markup = markup.slice( 0, edit.start ) + markup.slice( edit.end );
	}

	return { markup: markup.trim() + '\n', css: styles.join( '\n\n' ), scripts };
}

/** Read a section file the way the compiler does. */
export function readSectionFile( fs, fullPath ) {
	// Strip a UTF-8 BOM (homepage-section-03 had one; it broke patching before)
	// and normalise CRLF so byte comparisons are about content, not line endings.
	return fs.readFileSync( fullPath, 'utf8' ).replace( /^﻿/, '' ).replace( /\r\n/g, '\n' );
}
