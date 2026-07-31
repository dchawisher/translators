{
	"translatorID": "10ea8711-86e2-4d6f-9e84-9674c813fc65",
	"label": "Cambridge Dictionary",
	"creator": "David Hawisher",
	"target": "^https?://dictionary\\.cambridge\\.org/(us/)?dictionary/.",
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
	if (doc.querySelector('.pr.dictionary .def')) {
		return 'dictionaryEntry';
	}
	return false;
}

async function doWeb(doc, url) {
	await scrape(doc, url);
}

async function scrape(doc, url = doc.location.href) {
	let item = new Zotero.Item('dictionaryEntry');

	let word = headword(doc);
	item.title = word ? word.charAt(0).toUpperCase() + word.slice(1) : ZU.trimInternal(doc.title);
	item.dictionaryTitle = 'Cambridge.org';
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

// The headword as plain text ("jurisdiction")
function headword(doc) {
	return ZU.trimInternal(text(doc, '.pr.dictionary .di-title .hw'))
		|| ZU.trimInternal(text(doc, '.pr.dictionary .headword'));
}

function buildSnapshotHTML(doc, item, url) {
	// One .pr.dictionary block per source dictionary (Cambridge Advanced
	// Learner's, Academic Content, Business English, ...)
	let dictionaries = doc.querySelectorAll('.pr.dictionary');
	if (!dictionaries.length) return '';

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

	for (let dictionary of dictionaries) {
		appendDictionary(snapshotDoc, main, dictionary);
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

// One source dictionary's section: h2 naming the source, the entries, and the
// "(Definition of ... © Cambridge University Press)" attribution line
function appendDictionary(snapshotDoc, main, dictionary) {
	// The attribution's link names the source dictionary exactly
	let attribution = dictionary.querySelector('small.ddef');
	let sourceName = attribution && ZU.trimInternal(text(attribution, 'a'));
	if (sourceName) {
		let h2 = snapshotDoc.createElement('h2');
		h2.textContent = sourceName;
		main.appendChild(h2);
	}

	for (let entry of dictionary.querySelectorAll('.entry-body__el')) {
		appendEntry(snapshotDoc, main, entry);
	}

	if (attribution) {
		let p = snapshotDoc.createElement('p');
		p.className = 'metadata';
		p.textContent = ZU.trimInternal(attribution.textContent);
		main.appendChild(p);
	}
}

// One part-of-speech entry: headword heading, POS/grammar/pronunciation line,
// then the sense blocks
function appendEntry(snapshotDoc, main, entry) {
	let posHeader = entry.querySelector('.pos-header');
	if (posHeader) {
		let word = ZU.trimInternal(text(posHeader, '.di-title'));
		if (word) {
			let h3 = snapshotDoc.createElement('h3');
			h3.textContent = word;
			main.appendChild(h3);
		}

		// "noun [ U ] LAW uk /ˌdʒʊə.rɪsˈdɪk.ʃən/ us /ˌdʒʊr.ɪsˈdɪk.ʃən/"
		let parts = [];
		for (let el of posHeader.querySelectorAll('.posgram, .pos-header > .domain, .usage, .lab')) {
			let t = ZU.trimInternal(el.textContent);
			if (t) parts.push(t);
		}
		for (let pron of posHeader.querySelectorAll('.uk.dpron-i, .us.dpron-i')) {
			let region = ZU.trimInternal(text(pron, '.region'));
			let ipa = ZU.trimInternal(text(pron, '.pron'));
			if (ipa) parts.push((region ? region + ' ' : '') + ipa);
		}
		if (parts.length) {
			let p = snapshotDoc.createElement('p');
			p.textContent = parts.join(' ');
			main.appendChild(p);
		}
	}

	for (let dsense of entry.querySelectorAll('.dsense')) {
		appendSense(snapshotDoc, main, dsense);
	}
}

// One sense block: optional guideword header, then definitions with examples
function appendSense(snapshotDoc, main, dsense) {
	// Guideword header (e.g. "jurisdiction noun (AUTHORITY)") when the entry
	// splits senses under guidewords; absent (dsense-noh) otherwise
	let guide = dsense.querySelector('.dsense_h');
	if (guide) {
		let h4 = snapshotDoc.createElement('h4');
		h4.textContent = ZU.trimInternal(guide.textContent);
		main.appendChild(h4);
	}

	for (let block of dsense.querySelectorAll('.def-block')) {
		// Definition line: grammar/domain/usage labels + the definition text
		let defHead = block.querySelector('.ddef_h');
		if (defHead) {
			let p = snapshotDoc.createElement('p');
			p.className = 'nestingLevel-1';
			p.setAttribute('data-citate-nesting-level', '1');
			let info = defHead.querySelector('.def-info');
			if (info) {
				let label = ZU.trimInternal(info.textContent);
				if (label) p.appendChild(snapshotDoc.createTextNode(label + ' '));
			}
			let def = defHead.querySelector('.def');
			if (def) {
				for (let node of def.childNodes) appendInline(snapshotDoc, p, node);
			}
			// The source pads the trailing colon with a no-break space
			// ("judgments : ") — tighten it back to "judgments:"
			let last = p.lastChild;
			if (last && last.nodeType === 3) {
				last.nodeValue = last.nodeValue.replace(/\s+(:?)\s*$/, '$1');
			}
			if (ZU.trimInternal(p.textContent)) main.appendChild(p);
		}

		// Example sentences, with the bolded pattern phrase kept as strong
		for (let examp of block.querySelectorAll('.examp')) {
			let p = snapshotDoc.createElement('p');
			p.className = 'nestingLevel-2';
			p.setAttribute('data-citate-nesting-level', '2');
			let pattern = examp.querySelector('.lu');
			if (pattern && ZU.trimInternal(pattern.textContent)) {
				let strong = snapshotDoc.createElement('strong');
				strong.textContent = ZU.trimInternal(pattern.textContent);
				p.appendChild(strong);
				p.appendChild(snapshotDoc.createTextNode(' '));
			}
			let eg = examp.querySelector('.eg');
			if (eg && ZU.trimInternal(eg.textContent)) {
				let em = snapshotDoc.createElement('em');
				for (let node of eg.childNodes) appendInline(snapshotDoc, em, node);
				p.appendChild(em);
			}
			if (ZU.trimInternal(p.textContent)) main.appendChild(p);
		}
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
