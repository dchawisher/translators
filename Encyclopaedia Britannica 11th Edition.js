{
	"translatorID": "45c30afd-cab7-4d7b-aba3-c5854f7ef211",
	"label": "Encyclopaedia Britannica 11th Edition",
	"creator": "David Hawisher",
	"target": "^https?://(www\\.)?britannica11\\.org/article/.",
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

// Words kept lowercase when converting the all-caps article title
// ("LORD HIGH CONSTABLE" -> "Lord High Constable")
const TITLE_SMALL_WORDS = new Set(
	'a an and as at but by for in nor of on or the to via'.split(' ')
);

function detectWeb(doc, url) {
	if (/\/article\//.test(url) && articleRoot(doc)) {
		return 'encyclopediaArticle';
	}
	return false;
}

async function doWeb(doc, url) {
	await scrape(doc, url);
}

// The card inside #app holding the article: an h1 title, a "vol. N, p. N"
// line, an "In: ..." indexing line, and the .body-text
function articleRoot(doc) {
	let app = doc.querySelector('#app');
	if (!app) return null;
	let h1 = app.querySelector('h1');
	return h1 && app.querySelector('.body-text') ? h1.closest('.card') || app : null;
}

async function scrape(doc, url) {
	let root = articleRoot(doc);
	let item = new Zotero.Item('encyclopediaArticle');

	item.title = titleCase(ZU.trimInternal(text(root, 'h1')));
	item.encyclopediaTitle = 'Encyclopedia Britannica';
	item.edition = '11th';
	item.date = '1911';

	// "vol. 17, p. 3" appears immediately below the article title
	let volPage = volumeAndPage(root);
	if (volPage) {
		item.volume = volPage.volume;
		item.pages = volPage.page;
	}

	item.url = url;
	item.language = 'en';

	let snapshotContent = buildSnapshotHTML(doc, item, url);
	if (snapshotContent) {
		item.attachments.push({
			title: 'Encyclopedia Article Snapshot',
			url,
			mimeType: 'text/html',
			snapshotContent
		});
	}
	item.complete();
}

// Convert an all-caps headword to title case, keeping short connective
// words lowercase (except at the start)
function titleCase(str) {
	return str.toLowerCase().replace(/[^\s\-—–]+/g, (word, offset) => {
		if (offset > 0 && TITLE_SMALL_WORDS.has(word)) return word;
		return word.charAt(0).toUpperCase() + word.slice(1);
	});
}

// Find the "vol. 17, p. 3" line between the h1 and the body text
function volumeAndPage(root) {
	let h1 = root.querySelector('h1');
	for (let el = h1 && h1.nextElementSibling; el; el = el.nextElementSibling) {
		if (el.matches('.body-text')) break;
		let match = ZU.trimInternal(el.textContent)
			.match(/vol\.\s*(\d+)\s*,\s*p{1,2}\.\s*(\d+)/i);
		if (match) {
			return { volume: match[1], page: match[2], line: ZU.trimInternal(el.textContent) };
		}
	}
	return null;
}

function buildSnapshotHTML(doc, item, url) {
	let root = articleRoot(doc);
	if (!root) return '';

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
	metadata.textContent = [
		item.encyclopediaTitle,
		item.edition && item.edition + ' ed.',
		item.date,
		item.volume && 'vol. ' + item.volume,
		item.pages && 'p. ' + item.pages
	].filter(Boolean).join(', ');
	header.appendChild(metadata);
	// Indexing line ("In: Law and Political Science › Subjects")
	let indexing = root.querySelector('.contributors');
	if (indexing && ZU.trimInternal(indexing.textContent)) {
		let p = snapshotDoc.createElement('p');
		p.className = 'metadata';
		p.textContent = ZU.trimInternal(indexing.textContent);
		header.appendChild(p);
	}
	let source = snapshotDoc.createElement('p');
	source.className = 'source';
	source.appendChild(snapshotDoc.createTextNode('Source: '));
	let link = snapshotDoc.createElement('a');
	link.href = url;
	link.textContent = url;
	source.appendChild(link);
	header.appendChild(source);
	main.appendChild(header);

	for (let para of root.querySelectorAll('.body-text p')) {
		let p = snapshotDoc.createElement('p');
		for (let node of para.childNodes) {
			appendInline(snapshotDoc, p, node);
		}
		if (ZU.trimInternal(p.textContent)) main.appendChild(p);
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
// em/i, strong/b, sub, sup, br and text. Wrappers (font, span, a) are
// unwrapped, except page-scan markers ("17:3"), which become span.pageNumber.
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
	if (node.matches('.page-marker')) {
		let span = snapshotDoc.createElement('span');
		span.className = 'pageNumber';
		span.textContent = ZU.trimInternal(node.textContent);
		if (span.textContent) target.appendChild(span);
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
