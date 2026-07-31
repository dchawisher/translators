{
	"translatorID": "04f2c512-2860-4c00-a283-c91a82219c9a",
	"label": "American Heritage Dictionary",
	"creator": "David Hawisher",
	"target": "^https?://(www\\.)?ahdictionary\\.com/word/search\\.html",
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

const ORDINAL_EDITIONS = {
	first: '1st',
	second: '2nd',
	third: '3rd',
	fourth: '4th',
	fifth: '5th',
	sixth: '6th',
	seventh: '7th',
	eighth: '8th',
	ninth: '9th',
	tenth: '10th'
};

function detectWeb(doc, _url) {
	if (doc.querySelector('#results .rtseg')) {
		return 'dictionaryEntry';
	}
	return false;
}

async function doWeb(doc, url) {
	await scrape(doc, url);
}

async function scrape(doc, url = doc.location.href) {
	let results = doc.querySelector('#results');
	let item = new Zotero.Item('dictionaryEntry');

	let word = headword(results);
	item.title = word ? word.charAt(0).toUpperCase() + word.slice(1) : ZU.trimInternal(doc.title);

	// "The American Heritage® Dictionary of the English Language, Fifth
	// Edition copyright ©2022 by HarperCollins Publishers."
	let copyright = ZU.trimInternal(text(results, '.copyright'));
	let copyrightMatch = copyright.match(/^(.*?)®?( Dictionary[^,]*)?,\s*([A-Za-z]+)\s+Edition\s+copyright\s*©?\s*(\d{4})/i);
	if (copyrightMatch) {
		item.dictionaryTitle = ZU.trimInternal((copyrightMatch[1] + (copyrightMatch[2] || '')).replace(/®/g, ''));
		item.edition = ORDINAL_EDITIONS[copyrightMatch[3].toLowerCase()] || copyrightMatch[3];
		item.date = copyrightMatch[4];
	}
	else {
		item.dictionaryTitle = 'The American Heritage Dictionary';
	}

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

// The headword as plain text with the syllable dots removed
// ("ju·ris·dic·tion" -> "jurisdiction")
function headword(results) {
	return ZU.trimInternal(text(results, '.rtseg a[name]')).replace(/[·‧]/g, '');
}

function buildSnapshotHTML(doc, item, url) {
	let results = doc.querySelector('#results');
	if (!results) return '';

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
	metadata.textContent = [item.dictionaryTitle, item.edition && item.edition + ' ed.', item.date]
		.filter(Boolean).join(', ');
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

	// One td per entry; a search can return several homograph entries
	for (let entry of results.querySelectorAll('td')) {
		appendEntry(snapshotDoc, main, entry);
	}

	let copyright = ZU.trimInternal(text(results, '.copyright'));
	if (copyright) {
		let p = snapshotDoc.createElement('p');
		p.className = 'metadata';
		p.textContent = copyright;
		main.appendChild(p);
	}

	return ZU.trimInternal(main.textContent)
		? '<!DOCTYPE html>\n' + snapshotDoc.documentElement.outerHTML
		: '';
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
	// Headword + pronunciation. The rtseg also holds a .wav player link and a
	// right-aligned share widget; drop those, keep the rest of the text.
	let rtseg = entry.querySelector('.rtseg');
	if (rtseg) {
		let h2 = snapshotDoc.createElement('h2');
		let clean = rtseg.cloneNode(true);
		for (let junk of clean.querySelectorAll('a[href$=".wav"], div[align], [class*="share"]')) {
			junk.remove();
		}
		h2.textContent = ZU.trimInternal(clean.textContent);
		main.appendChild(h2);
	}

	// Part-of-speech segments: leading POS label, then numbered definitions
	// (.ds-list), possibly with lettered sub-definitions (.sds-list)
	for (let pseg of entry.querySelectorAll('.pseg')) {
		let pos = snapshotDoc.createElement('p');
		for (let node of pseg.childNodes) {
			if (node.nodeType === 1 && node.matches('.ds-list')) break;
			appendInline(snapshotDoc, pos, node);
		}
		if (ZU.trimInternal(pos.textContent)) main.appendChild(pos);

		for (let ds of pseg.querySelectorAll(':scope > .ds-list')) {
			appendDefinition(snapshotDoc, main, ds, 1);
		}
	}

	// Etymology
	let etyseg = entry.querySelector('.etyseg');
	if (etyseg) {
		let p = snapshotDoc.createElement('p');
		for (let node of etyseg.childNodes) appendInline(snapshotDoc, p, node);
		main.appendChild(p);
	}

	// Variant/run-on forms ("ju′ris·dic′tion·al adj.")
	for (let runseg of entry.querySelectorAll('.runseg')) {
		let p = snapshotDoc.createElement('p');
		for (let node of runseg.childNodes) appendInline(snapshotDoc, p, node);
		if (ZU.trimInternal(p.textContent)) main.appendChild(p);
	}
}

function appendDefinition(snapshotDoc, main, ds, level) {
	let p = snapshotDoc.createElement('p');
	p.className = 'nestingLevel-' + level;
	p.setAttribute('data-citate-nesting-level', String(level));
	let subLists = [];
	for (let node of ds.childNodes) {
		if (node.nodeType === 1 && node.matches('.sds-list, .ds-list')) {
			subLists.push(node);
			continue;
		}
		appendInline(snapshotDoc, p, node);
	}
	if (ZU.trimInternal(p.textContent)) main.appendChild(p);
	for (let sub of subLists) {
		appendDefinition(snapshotDoc, main, sub, Math.min(level + 1, 12));
	}
}

// Copy a source node into the snapshot keeping only semantic inline markup:
// em/i, strong/b, sub, sup and text. Wrappers (font, span, a) are unwrapped.
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
	// Everything else (font, span, a, div wrappers): unwrap
	for (let child of node.childNodes) appendInline(snapshotDoc, target, child);
}

/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/
