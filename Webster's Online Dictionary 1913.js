{
	"translatorID": "e6dfc4e2-0f81-47ef-9271-250c8db67a0b",
	"label": "Webster's Online Dictionary 1913",
	"creator": "David Hawisher",
	"target": "^https?://(www\\.)?webster-dictionary\\.org/definition/.",
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
	if (websterSource(doc)) {
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
	item.title = word ? word.charAt(0).toUpperCase() + word.slice(1) : ZU.trimInternal(text(doc, 'h1'));

	item.dictionaryTitle = "Webster's Dictionary";
	// The section label is "Webster's 1913 Dictionary"
	let sourceLabel = ZU.trimInternal(websterSource(doc).textContent);
	let yearMatch = sourceLabel.match(/\b(1[5-9]\d\d)\b/);
	item.date = yearMatch ? yearMatch[1] : '1913';

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

// The .Source heading div that opens the Webster's 1913 section
function websterSource(doc) {
	for (let source of doc.querySelectorAll('div.Source')) {
		if (/webster/i.test(source.textContent)) {
			return source;
		}
	}
	return null;
}

// Sibling elements between the Webster's 1913 .Source div and the next
// .Source div (WordNet, Legal Dictionary, etc., which are excluded)
function websterSectionNodes(doc) {
	let source = websterSource(doc);
	let nodes = [];
	if (!source) return nodes;
	for (let node = source.nextSibling; node; node = node.nextSibling) {
		if (node.nodeType === 1 && node.matches('div.Source')) break;
		nodes.push(node);
	}
	return nodes;
}

// The headword as plain text with the syllable/accent marks removed
// ("Ju`ris`dic´tion" -> "Jurisdiction")
function headword(doc) {
	for (let node of websterSectionNodes(doc)) {
		if (node.nodeType === 1) {
			let hw = node.matches('.TitleLine') ? node : node.querySelector && node.querySelector('.TitleLine');
			if (hw) return ZU.trimInternal(hw.textContent).replace(/[`´·‧ʼ']/g, '');
		}
	}
	return '';
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

	for (let node of websterSectionNodes(doc)) {
		if (node.nodeType !== 1) continue;
		if (node.matches('.TitleLine')) {
			// Headword with pronunciation marks
			let h2 = snapshotDoc.createElement('h2');
			h2.textContent = ZU.trimInternal(node.textContent);
			if (h2.textContent) main.appendChild(h2);
		}
		else if (node.matches('table')) {
			for (let row of node.querySelectorAll('tr')) {
				appendDefinitionRow(snapshotDoc, main, row);
			}
		}
		// Skip everything else in the section (Facebook widget, ads, <br>s)
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

// One table row: cells hold [part of speech] [sense number] [definition].
// A row with an empty definition cell is a part-of-speech/entry header line.
function appendDefinitionRow(snapshotDoc, main, row) {
	let cells = row.querySelectorAll(':scope > td');
	if (!cells.length) return;
	let defCell = cells[cells.length - 1];
	let labelCells = Array.from(cells).slice(0, -1);

	if (!ZU.trimInternal(defCell.textContent)) {
		// Header row, e.g. "n. 1." (part of speech + entry number)
		let p = snapshotDoc.createElement('p');
		for (let cell of labelCells) {
			if (!ZU.trimInternal(cell.textContent)) continue;
			if (ZU.trimInternal(p.textContent)) p.appendChild(snapshotDoc.createTextNode(' '));
			for (let node of cell.childNodes) appendInline(snapshotDoc, p, node);
		}
		if (ZU.trimInternal(p.textContent)) main.appendChild(p);
		return;
	}

	// Definition row: leading sense number from the label cells, then the
	// definition text. Block quotations (.q) are pulled out as blockquotes.
	let p = snapshotDoc.createElement('p');
	p.className = 'nestingLevel-1';
	p.setAttribute('data-citate-nesting-level', '1');
	for (let cell of labelCells) {
		if (!ZU.trimInternal(cell.textContent)) continue;
		if (ZU.trimInternal(p.textContent)) p.appendChild(snapshotDoc.createTextNode(' '));
		for (let node of cell.childNodes) appendInline(snapshotDoc, p, node);
	}
	if (ZU.trimInternal(p.textContent)) p.appendChild(snapshotDoc.createTextNode(' '));

	let quotes = [];
	for (let node of defCell.childNodes) {
		if (node.nodeType === 1 && node.matches('div.q')) {
			quotes.push(node);
			continue;
		}
		appendInline(snapshotDoc, p, node);
	}
	if (ZU.trimInternal(p.textContent)) main.appendChild(p);

	for (let q of quotes) {
		let blockquote = snapshotDoc.createElement('blockquote');
		blockquote.className = 'nestingLevel-2';
		blockquote.setAttribute('data-citate-nesting-level', '2');
		for (let node of q.childNodes) {
			if (node.nodeType === 1 && node.matches('div.author')) {
				// Attribution line ("- Milton.") on its own line
				blockquote.appendChild(snapshotDoc.createElement('br'));
				let author = snapshotDoc.createElement('em');
				for (let child of node.childNodes) appendInline(snapshotDoc, author, child);
				if (author.textContent) blockquote.appendChild(author);
				continue;
			}
			appendInline(snapshotDoc, blockquote, node);
		}
		if (ZU.trimInternal(blockquote.textContent)) main.appendChild(blockquote);
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
