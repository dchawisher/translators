{
	"translatorID": "fcd52586-5032-4401-8574-04fa6c3ee178",
	"label": "Merriam-Webster Dictionary",
	"creator": "David Hawisher",
	"target": "^https?://www\\.merriam-webster\\.com/dictionary/.",
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
	if (doc.querySelector('.entry-word-section-container .hword')) {
		return 'dictionaryEntry';
	}
	return false;
}

async function doWeb(doc, url) {
	await scrape(doc, url);
}

async function scrape(doc, url) {
	let item = new Zotero.Item('dictionaryEntry');

	let word = ZU.trimInternal(text(doc, '.entry-word-section-container .hword'));
	item.title = word ? word.charAt(0).toUpperCase() + word.slice(1) : ZU.trimInternal(doc.title);
	item.dictionaryTitle = 'Merriam-Webster.com';
	// "Last Updated: 5 Jul 2026" dateline, when the page provides one
	let dateline = doc.querySelector('.dateline-widget time[datetime]');
	if (dateline) {
		item.date = dateline.getAttribute('datetime');
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
	metadata.textContent = [item.dictionaryTitle, item.date && 'Last updated ' + item.date]
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

	// Main dictionary entries: one container per part-of-speech homograph
	// (#dictionary-entry-1, #dictionary-entry-2, ...)
	for (let entry of doc.querySelectorAll('.entry-word-section-container')) {
		appendEntry(snapshotDoc, main, entry, 'h2');
	}

	// "Did you know?" note
	let didYouKnow = doc.querySelector('#did-you-know');
	if (didYouKnow) {
		appendSectionHeading(snapshotDoc, main, 'h2', text(didYouKnow, '.content-section-header h2') || 'Did you know?');
		for (let p of didYouKnow.querySelectorAll('.content-section-body p')) {
			appendParagraph(snapshotDoc, main, p);
		}
	}

	// Word History: etymology and first known use (skip the "Time Traveler"
	// recirculation block)
	let wordHistory = doc.querySelector('#word-history');
	if (wordHistory) {
		appendSectionHeading(snapshotDoc, main, 'h2', text(wordHistory, '.content-section-header h2') || 'Word History');
		appendEtymologySections(snapshotDoc, main, wordHistory, 'h3');
	}

	// Supplemental dictionaries ("Kids Definition", "Legal Definition"):
	// real lexicographic content from MW's other dictionaries
	for (let widget of doc.querySelectorAll('.more_defs .widget.content-section-with-header')) {
		let heading = ZU.trimInternal(text(widget, '.content-section-header h2'));
		let entries = widget.querySelectorAll('.entry-word-section-container-supplemental');
		if (!entries.length) continue;
		appendSectionHeading(snapshotDoc, main, 'h2', heading);
		for (let entry of entries) {
			appendEntry(snapshotDoc, main, entry, 'h3');
		}
		appendEtymologySections(snapshotDoc, main, widget, 'h3');
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

function appendSectionHeading(snapshotDoc, main, tag, textContent) {
	let clean = ZU.trimInternal(textContent || '');
	if (!clean) return;
	let heading = snapshotDoc.createElement(tag);
	heading.textContent = clean;
	main.appendChild(heading);
}

function appendParagraph(snapshotDoc, main, sourceEl) {
	let p = snapshotDoc.createElement('p');
	for (let node of sourceEl.childNodes) appendInline(snapshotDoc, p, node);
	if (ZU.trimInternal(p.textContent)) main.appendChild(p);
}

// One dictionary entry: headword, part of speech, syllables, pronunciation,
// the numbered senses, and run-on/"other forms" words
function appendEntry(snapshotDoc, main, entry, headingTag) {
	let word = ZU.trimInternal(text(entry, '.hword'));
	appendSectionHeading(snapshotDoc, main, headingTag, word);

	let attrs = [];
	let pos = ZU.trimInternal(text(entry, '.entry-header-content .parts-of-speech')
		|| text(entry, '.entry-header-content .important-blue-link'));
	if (pos) attrs.push(pos);
	let syllables = ZU.trimInternal(text(entry, '.word-syllables-entry'));
	if (syllables && syllables !== word) attrs.push(syllables);
	let pron = pronunciation(entry.querySelector('.word-syllables-prons-header-content'));
	if (pron) attrs.push(pron);
	if (attrs.length) {
		let p = snapshotDoc.createElement('p');
		p.appendChild(snapshotDoc.createTextNode(attrs.join(' | ')));
		main.appendChild(p);
	}

	for (let vg of entry.querySelectorAll(':scope > .vg')) {
		appendVerbGroup(snapshotDoc, main, vg, '');
	}

	// Run-on "other forms" ("jurisdictional adjective")
	for (let uro of entry.querySelectorAll('.entry-uros .uro')) {
		let p = snapshotDoc.createElement('p');
		let strong = snapshotDoc.createElement('strong');
		strong.textContent = ZU.trimInternal(text(uro, '.ure'));
		if (!strong.textContent) continue;
		p.appendChild(strong);
		let uroPron = pronunciation(uro);
		if (uroPron) p.appendChild(snapshotDoc.createTextNode(' ' + uroPron));
		let fl = ZU.trimInternal(text(uro, '.fl'));
		if (fl) {
			p.appendChild(snapshotDoc.createTextNode(' '));
			let em = snapshotDoc.createElement('em');
			em.textContent = fl;
			p.appendChild(em);
		}
		main.appendChild(p);
	}

	// Defined run-on phrases, when the entry has them
	for (let dro of entry.querySelectorAll('.dros .dro, :scope > .dro')) {
		let p = snapshotDoc.createElement('p');
		let strong = snapshotDoc.createElement('strong');
		strong.textContent = ZU.trimInternal(text(dro, '.drp'));
		if (strong.textContent) p.appendChild(strong);
		if (p.childNodes.length) main.appendChild(p);
		for (let vg of dro.querySelectorAll('.vg')) {
			appendVerbGroup(snapshotDoc, main, vg, '');
		}
	}
}

// MW wraps the pronunciation in an audio-player link; keep the phonetic text
function pronunciation(scope) {
	if (!scope) return '';
	let pron = ZU.trimInternal(text(scope, '.play-pron-v2, .pron-syllable, .prons-entries-list-inline'));
	return pron ? '\\' + pron + '\\' : '';
}

// A .vg holds the sense sequence: .vg-sseq-entry-item blocks whose
// .vg-sseq-entry-item-label carries the sense number ("1", "2", ...);
// sub-vgs inside defined run-ons hold bare .sb blocks
function appendVerbGroup(snapshotDoc, main, vg, phraseLabel) {
	for (let child of vg.children) {
		if (child.matches('.vd')) {
			// "transitive verb" / "intransitive verb" divider
			appendParagraph(snapshotDoc, main, child);
		}
		else if (child.matches('.vg-sseq-entry-item')) {
			let label = ZU.trimInternal(text(child, ':scope > .vg-sseq-entry-item-label'));
			for (let sb of child.querySelectorAll(':scope > .sb')) {
				appendSenseBlock(snapshotDoc, main, sb, label);
			}
		}
		else if (child.matches('.sb')) {
			appendSenseBlock(snapshotDoc, main, child, phraseLabel);
		}
	}
}

function appendSenseBlock(snapshotDoc, main, sb, label) {
	let first = true;
	for (let sense of sb.querySelectorAll(':scope > * > .sense')) {
		appendSense(snapshotDoc, main, sense, first ? label : '');
		first = false;
	}
}

// Sense dividers "1" / "a" / "(1)" map to nesting levels 1 / 2 / 3
function senseLevel(senseNumber) {
	if (/^\(\d+\)/.test(senseNumber)) return 3;
	if (/^[a-z]/.test(senseNumber)) return 2;
	return 1;
}

function appendSense(snapshotDoc, main, sense, numberLabel) {
	let sn = ZU.trimInternal(text(sense, ':scope > .sn'));
	let level = senseLevel(sn);
	let prefix = ZU.trimInternal([numberLabel, sn].filter(Boolean).join(' '));

	let p = snapshotDoc.createElement('p');
	p.className = 'nestingLevel-' + level;
	p.setAttribute('data-citate-nesting-level', String(level));
	if (prefix) {
		let strong = snapshotDoc.createElement('strong');
		strong.textContent = prefix;
		p.appendChild(strong);
		p.appendChild(snapshotDoc.createTextNode(' '));
	}

	let followers = [];
	appendSenseParts(snapshotDoc, p, sense, followers);
	if (ZU.trimInternal(p.textContent)) main.appendChild(p);

	for (let follower of followers) {
		if (follower.matches('.snote')) {
			let note = snapshotDoc.createElement('p');
			note.className = 'nestingLevel-' + level;
			note.setAttribute('data-citate-nesting-level', String(level));
			for (let node of follower.childNodes) appendInline(snapshotDoc, note, node);
			if (ZU.trimInternal(note.textContent)) main.appendChild(note);
		}
		else if (follower.matches('.subs')) {
			appendSubEntries(snapshotDoc, main, follower, Math.min(level + 1, 12));
		}
	}
}

// The parts of one sense: the .dt definition plus any sibling
// "specifically/also" .sdsense runs; .subs sub-entry blocks (siblings of the
// .dt inside .sense-content) go to followers
function appendSenseParts(snapshotDoc, p, sense, followers) {
	let parts = sense.querySelectorAll([
		':scope > .dt',
		':scope > .sdsense',
		':scope > .subs',
		':scope > .sense-content > .dt',
		':scope > .sense-content > .sdsense',
		':scope > .sense-content > .subs'
	].join(', '));
	for (let part of parts) {
		if (part.matches('.dt')) {
			appendDefinitionText(snapshotDoc, p, part, followers);
		}
		else if (part.matches('.sdsense')) {
			p.appendChild(snapshotDoc.createTextNode(' '));
			for (let child of part.childNodes) appendInline(snapshotDoc, p, child);
		}
		else {
			followers.push(part);
		}
	}
}

// The definition proper: dtText runs, "specifically/also/broadly" sdsense
// runs, and curated example sentences, all inline in the sense paragraph;
// notes and defined sub-entries are pulled out as follow-on blocks
function appendDefinitionText(snapshotDoc, target, dt, followers) {
	for (let node of dt.childNodes) {
		if (node.nodeType !== 1) {
			appendInline(snapshotDoc, target, node);
			continue;
		}
		if (node.matches('.snote, .subs')) {
			followers.push(node);
		}
		else if (node.matches('.sdsense')) {
			target.appendChild(snapshotDoc.createTextNode(' '));
			for (let child of node.childNodes) appendInline(snapshotDoc, target, child);
		}
		else if (node.matches('.sub-content-thread, .ex-sent')) {
			// Curated example sentence(s), possibly with a quote attribution;
			// the wrapper is sometimes itself the .ex-sent
			let sents = node.querySelectorAll('.ex-sent');
			if (!sents.length) sents = [node];
			for (let sent of sents) {
				target.appendChild(snapshotDoc.createTextNode(' '));
				for (let child of sent.childNodes) appendInline(snapshotDoc, target, child);
			}
		}
		else {
			appendInline(snapshotDoc, target, node);
		}
	}
}

// Defined sub-entries within a sense ("— alienage jurisdiction : ...")
function appendSubEntries(snapshotDoc, main, subs, level) {
	for (let sub of subs.querySelectorAll(':scope > .sub')) {
		let p = snapshotDoc.createElement('p');
		p.className = 'nestingLevel-' + level;
		p.setAttribute('data-citate-nesting-level', String(level));
		p.appendChild(snapshotDoc.createTextNode('— '));
		let strong = snapshotDoc.createElement('strong');
		strong.textContent = ZU.trimInternal(text(sub, ':scope > .shw'));
		if (strong.textContent) p.appendChild(strong);
		let followers = [];
		for (let sense of sub.querySelectorAll('.sense')) {
			p.appendChild(snapshotDoc.createTextNode(' '));
			appendSenseParts(snapshotDoc, p, sense, followers);
		}
		if (ZU.trimInternal(p.textContent) !== '—') main.appendChild(p);
		for (let follower of followers) {
			if (follower.matches('.subs')) {
				appendSubEntries(snapshotDoc, main, follower, Math.min(level + 1, 12));
			}
		}
	}
}

// Etymology / First Known Use blocks inside a "Word History" or supplemental
// definition widget; the "Time Traveler" block is site recirculation
function appendEtymologySections(snapshotDoc, main, scope, headingTag) {
	let sections = scope.querySelectorAll('.etymology-content-section, .first-known-content-section');
	for (let section of sections) {
		appendSectionHeading(snapshotDoc, main, headingTag, text(section, '.content-section-sub-header'));
		for (let p of section.querySelectorAll('p')) {
			appendParagraph(snapshotDoc, main, p);
		}
	}
}

// Copy a source node into the snapshot keeping only semantic inline markup:
// em/i, strong/b, sub, sup and text. Wrappers (font, span, a) are unwrapped.
// MW's italic run-in spans (.mw_t_wi words in examples, .sd sense dividers)
// map to em.
function appendInline(snapshotDoc, target, node) {
	if (node.nodeType === 3) { // text
		// Collapse the source markup's indentation whitespace
		let collapsed = node.nodeValue.replace(/\s+/g, ' ');
		if (collapsed) target.appendChild(snapshotDoc.createTextNode(collapsed));
		return;
	}
	if (node.nodeType !== 1) return;
	let tag = node.tagName.toLowerCase();
	if (['script', 'style', 'iframe', 'img', 'audio', 'video', 'button', 'input', 'svg', 'title'].includes(tag)) return;
	if (tag === 'br') {
		target.appendChild(snapshotDoc.createElement('br'));
		return;
	}
	let mapped = { i: 'em', b: 'strong' }[tag];
	if (!mapped && ['em', 'strong', 'sub', 'sup'].includes(tag)) mapped = tag;
	if (!mapped && node.matches('.mw_t_wi, .sd')) mapped = 'em';
	if (mapped) {
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
