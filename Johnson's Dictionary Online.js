{
	"translatorID": "9f474516-b55b-45f3-9a1d-b75581edb372",
	"label": "Johnson's Dictionary Online",
	"creator": "David Hawisher",
	"target": "^https?://(www\\.)?johnsonsdictionaryonline\\.com/\\d{4}/.",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-07-06 11:58:11"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2026 David Hawisher

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/

function detectWeb(doc, _url) {
	if (doc.querySelector('#result_word headword')) {
		return 'dictionaryEntry';
	}
	return false;
}

async function doWeb(doc, url) {
	await scrape(doc, url);
}

async function scrape(doc, url) {
	let item = new Zotero.Item('dictionaryEntry');

	item.title = headword(doc);
	item.dictionaryTitle = "Johnson's Dictionary";
	item.date = editionYear(doc, url);
	item.url = url;
	item.language = 'en';

	let snapshotContent = buildSnapshotHTML(doc, item, url);
	if (snapshotContent) {
		item.attachments.push({
			title: 'Dictionary Entry Snapshot',
			url,
			mimeType: 'text/html',
			snapshotContent
		});
	}
	item.complete();
}

// The headword as plain modern text, first letter capitalized, without the
// part-of-speech suffix ("Jurisdiction", not "Jurisdi'ction. n.s.")
function headword(doc) {
	// The result list marks the displayed entry with name="<word>"
	let word = attr(doc, '#result li.active[name]', 'name');
	if (!word) {
		// Hidden page title: "jurisdiction, n.s. (1755)"
		word = ZU.trimInternal(text(doc, 'title.sf-hidden')).split(',')[0];
	}
	if (!word) {
		// The printed headword ("Jurisdi'ction.") minus accent and period
		word = ZU.trimInternal(text(doc, '#result_word headword')).replace(/['’ʼ]/g, '').replace(/[.\s].*$/, '');
	}
	return word ? word.charAt(0).toUpperCase() + word.slice(1) : '';
}

// The edition year, from the /1755/ or /1773/ URL path segment, the result
// list's edition badge, or the hidden page title
function editionYear(doc, url) {
	let urlMatch = url.match(/johnsonsdictionaryonline\.com\/(\d{4})\//);
	if (urlMatch) return urlMatch[1];
	let edition = ZU.trimInternal(text(doc, '#result li.active .edition'));
	if (/^\d{4}$/.test(edition)) return edition;
	let titleMatch = ZU.trimInternal(text(doc, 'title.sf-hidden')).match(/\((\d{4})\)/);
	return titleMatch ? titleMatch[1] : '';
}

function buildSnapshotHTML(doc, item, url) {
	let snapshotDoc = doc.implementation.createHTMLDocument(item.title);
	snapshotDoc.documentElement.setAttribute('lang', 'en');
	appendSnapshotHead(snapshotDoc, item, url);
	snapshotDoc.body.className = 'citate-semantic-snapshot';

	let main = snapshotDoc.createElement('main');
	main.className = 'document';
	snapshotDoc.body.appendChild(main);

	let header = snapshotDoc.createElement('header');
	header.className = 'documentHeader';
	let h1 = snapshotDoc.createElement('h1');
	h1.textContent = item.title;
	header.appendChild(h1);
	let metadata = snapshotDoc.createElement('p');
	metadata.className = 'metadata';
	metadata.textContent = [item.dictionaryTitle, item.date].filter(Boolean).join(', ');
	header.appendChild(metadata);
	let source = snapshotDoc.createElement('p');
	source.className = 'source';
	source.appendChild(snapshotDoc.createTextNode('Source: '));
	let link = snapshotDoc.createElement('a');
	link.href = url;
	link.textContent = url;
	source.appendChild(link);
	header.appendChild(source);
	main.appendChild(header);

	// Each transcribed entry is a div in the #result_word pane holding a
	// <headword>; the rest of the page (scanned page images, search UI,
	// navigation) is excluded
	for (let hw of doc.querySelectorAll('#result_word headword')) {
		appendEntry(snapshotDoc, main, hw.parentElement);
	}

	normalizeWhitespace(snapshotDoc, main);
	return ZU.trimInternal(main.textContent)
		? '<!DOCTYPE html>\n' + snapshotDoc.documentElement.outerHTML
		: '';
}

// The transcription pane's markup is newline-heavy; collapse runs of
// whitespace in every text node and drop the ones left empty
function normalizeWhitespace(snapshotDoc, root) {
	let walker = snapshotDoc.createTreeWalker(root, 0x4 /* NodeFilter.SHOW_TEXT */);
	let textNodes = [];
	while (walker.nextNode()) textNodes.push(walker.currentNode);
	for (let node of textNodes) {
		node.nodeValue = node.nodeValue.replace(/\s+/g, ' ');
		let block = node.parentNode;
		let isFirst = !node.previousSibling;
		let isLast = !node.nextSibling;
		if (isFirst) node.nodeValue = node.nodeValue.replace(/^ /, '');
		if (isLast) node.nodeValue = node.nodeValue.replace(/ $/, '');
		if (!node.nodeValue) block.removeChild(node);
	}
}

function appendSnapshotHead(snapshotDoc, item, url) {
	let head = snapshotDoc.head;
	let charset = snapshotDoc.createElement('meta');
	charset.setAttribute('charset', 'utf-8');
	head.appendChild(charset);
	let title = snapshotDoc.querySelector('head > title');
	if (!title) {
		title = snapshotDoc.createElement('title');
		head.appendChild(title);
	}
	title.textContent = item.title;
	let canonical = snapshotDoc.createElement('meta');
	canonical.setAttribute('name', 'citate-source-url');
	canonical.setAttribute('content', url);
	head.appendChild(canonical);
	// No stylesheet: Zotero core owns the semantic snapshot CSS
}

function appendEntry(snapshotDoc, main, entry) {
	// The headword as printed, small-caps accents and all ("Jurisdi'ction.")
	let hw = entry.querySelector('headword');
	if (hw) {
		let h2 = snapshotDoc.createElement('h2');
		h2.textContent = ZU.trimInternal(hw.textContent);
		main.appendChild(h2);
	}

	// Everything between the headword and the first sense — part of speech
	// and etymology — becomes one introductory paragraph
	let intro = snapshotDoc.createElement('p');
	for (let node of entry.childNodes) {
		if (node.nodeType === 1 && node.matches('headword, br')) continue;
		if (node.nodeType === 1 && node.matches('sense')) break;
		appendInline(snapshotDoc, intro, node);
	}
	if (ZU.trimInternal(intro.textContent)) main.appendChild(intro);

	for (let sense of entry.querySelectorAll(':scope > sense')) {
		appendSense(snapshotDoc, main, sense);
	}
}

function appendSense(snapshotDoc, main, sense) {
	// The numbered definition ("1. Legal authority; extent of power.")
	for (let def of sense.querySelectorAll(':scope > sjddef')) {
		let p = snapshotDoc.createElement('p');
		p.className = 'nestingLevel-1';
		p.setAttribute('data-citate-nesting-level', '1');
		for (let node of def.childNodes) appendInline(snapshotDoc, p, node);
		if (ZU.trimInternal(p.textContent)) main.appendChild(p);
	}

	// Quotation examples with their attributions
	for (let qb of sense.querySelectorAll(':scope > quotebibl')) {
		appendQuote(snapshotDoc, main, qb);
	}
}

function appendQuote(snapshotDoc, main, qb) {
	let blockquote = snapshotDoc.createElement('blockquote');
	let quote = snapshotDoc.createElement('p');
	let attribution = snapshotDoc.createElement('p');
	// Quote text runs until the br.bibl separator (or the first attribution
	// element); author, scope, and title lines follow it
	let target = quote;
	for (let node of qb.childNodes) {
		if (node.nodeType === 1
				&& node.matches('br.bibl, .author, biblscope, bibltitle')) {
			target = attribution;
			if (node.matches('br')) continue;
		}
		appendInline(snapshotDoc, target, node);
	}
	trimTrailingBreaks(quote);
	for (let p of [quote, attribution]) {
		if (ZU.trimInternal(p.textContent)) blockquote.appendChild(p);
	}
	if (blockquote.childNodes.length) main.appendChild(blockquote);
}

function trimTrailingBreaks(el) {
	while (el.lastChild
			&& (el.lastChild.nodeName === 'BR'
				|| (el.lastChild.nodeType === 3 && !el.lastChild.nodeValue.trim()))) {
		el.lastChild.remove();
	}
}

// Copy a source node into the snapshot keeping only semantic inline markup:
// em/i, strong/b, sub, sup and text. Wrappers (font, span, a, custom TEI
// elements) are unwrapped; icons, images, and scripts are dropped.
function appendInline(snapshotDoc, target, node) {
	if (node.nodeType === 3) { // text
		target.appendChild(snapshotDoc.createTextNode(node.nodeValue));
		return;
	}
	if (node.nodeType !== 1) return;
	let tag = node.tagName.toLowerCase();
	if (['script', 'style', 'iframe', 'img', 'audio', 'video', 'button', 'input'].includes(tag)) return;
	if (tag === 'br') {
		target.appendChild(snapshotDoc.createElement('br'));
		return;
	}
	if (['i', 'em'].includes(tag) || ['b', 'strong', 'sub', 'sup'].includes(tag)) {
		let mapped = { i: 'em', b: 'strong' }[tag] || tag;
		let el = snapshotDoc.createElement(mapped);
		for (let child of node.childNodes) appendInline(snapshotDoc, el, child);
		if (el.textContent) target.appendChild(el);
		return;
	}
	// Everything else (font, span, a, TEI wrappers): unwrap
	for (let child of node.childNodes) appendInline(snapshotDoc, target, child);
}

/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/
