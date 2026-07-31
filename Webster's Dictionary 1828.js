{
	"translatorID": "1be50090-8205-4c19-938e-1a72d098a441",
	"label": "Webster's Dictionary 1828",
	"creator": "David Hawisher",
	"target": "^https?://(www\\.)?webstersdictionary1828\\.com/Dictionary/.",
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
	if (doc.querySelector('h3.dictionaryhead')) {
		return 'dictionaryEntry';
	}
	return false;
}

async function doWeb(doc, url) {
	await scrape(doc, url);
}

async function scrape(doc, url) {
	let item = new Zotero.Item('dictionaryEntry');

	let word = headword(doc);
	item.title = word ? word.charAt(0).toUpperCase() + word.slice(1) : ZU.trimInternal(doc.title);
	item.dictionaryTitle = "Webster's Dictionary";
	item.date = '1828';
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

function headword(doc) {
	return ZU.trimInternal(text(doc, 'h3.dictionaryhead')).toLowerCase();
}

// The entry body: the sibling <div>s that follow h3.dictionaryhead, holding
// one <p> per paragraph (headword/etymology line, then numbered definitions).
// Skips chrome divs (mobile-only ad slots, banners).
function entryParagraphs(doc) {
	let head = doc.querySelector('h3.dictionaryhead');
	if (!head) return [];
	let paragraphs = [];
	for (let sibling = head.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
		if (sibling.matches('.d-md-none, .sf-hidden, [class*="banner"]')) continue;
		if (sibling.tagName === 'P') {
			paragraphs.push(sibling);
		}
		else {
			for (let p of sibling.querySelectorAll('p')) {
				if (p.closest('.d-md-none, .sf-hidden, [class*="banner"]')) continue;
				paragraphs.push(p);
			}
		}
	}
	return paragraphs;
}

function buildSnapshotHTML(doc, item, url) {
	let paragraphs = entryParagraphs(doc);
	if (!paragraphs.length) return '';

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

	for (let sourceP of paragraphs) {
		let p = snapshotDoc.createElement('p');
		for (let node of sourceP.childNodes) appendInline(snapshotDoc, p, node);
		if (!ZU.trimInternal(p.textContent)) continue;
		// Numbered definitions ("1. The legal power...") indent one level;
		// the headword/etymology line and unnumbered remarks stay flush.
		if (/^\d+\.\s/.test(ZU.trimInternal(p.textContent))) {
			p.className = 'nestingLevel-1';
			p.setAttribute('data-citate-nesting-level', '1');
		}
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
	if (['i', 'em', 'b', 'strong', 'sub', 'sup'].includes(tag)) {
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
