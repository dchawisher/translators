{
	"translatorID": "fc9e5c87-2a77-450c-8a05-d48c58dbca69",
	"label": "Westlaw",
	"creator": "David Hawisher",
	"target": "^.*westlaw.*",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 10,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-06-30 02:13:25"
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

//Helper patterns for Title and Case Name processing
var govPattern = /\b(?:city|county|cty\.) of\b|^state\b|^United States$|^U\.S\.$/i;
var trimPattern = /(^( )|( |,|Inc.|Co.|LLC|LLLP|LLP)$)/mgi;
var stockHighlightColors = {
	yellow: "#ffd400",
	green: "#5fb236",
	blue: "#2ea8e5",
	orange: "#f19837",
	red: "#ff6666",
	pink: "#e56eee",
	purple: "#a28ae5",
	gray: "#aaaaaa",
	black: "#aaaaaa"
};

//Helper array for using the preferred reporter.
var preferredReporters = [
	['U.S.', true],
	['S.Ct.', true],
	['F.4th', true],
	['F.3d', true],
	['F.2d', true],
	['F.Supp.3d', true],
	['F.Supp.2d', true],
	['F.Supp.', true],
	['F.R.D.', true],
	['Fed.Appx.', true],
	['N.C.', true],
	['N.C.App.', true],
	['S.E.2d', true],
	['S.E.', true],
	['NCSC', false],
	['NCCOA', false],
	['NCBC', false],
	['WL', false]
];
var vendorNeutralReporters = ['NCCOA', 'NCSC', 'NCBC'];

var fedMap = {
	"United States Court of Appeals, First Circuit": "us:c1",
	"United States Court of Appeals, Second Circuit": "us:c2",
	"United States Court of Appeals, Third Circuit": "us:c3",
	"United States Court of Appeals, Fourth Circuit": "us:c4",
	"United States Court of Appeals, Fifth Circuit": "us:c5",
	"United States Court of Appeals, Sixth Circuit": "us:c6",
	"United States Court of Appeals, Seventh Circuit": "us:c7",
	"United States Court of Appeals, Eighth Circuit": "us:c8",
	"United States Court of Appeals, Ninth Circuit": "us:c9",
	"United States Court of Appeals, Tenth Circuit": "us:c10",
	"United States Court of Appeals, Eleventh Circuit": "us:c11",
	"United States District Court, N.D. Georgia": "us:c11:ga.nd",
	"United States District Court, W.D. Michigan": "us:c6:mi.wd",
	"United States District Court, D. Maine": "us:c1:me.d",
	"United States District Court, W.D. Tennessee": "us:c6:tn.wd",
	"United States District Court, S.D. Ohio": "us:c6:oh.sd",
	"United States District Court, D. South Carolina": "us:c4:sc.d",
	"United States District Court, S.D. Illinois": "us:c7:il.sd",
	"United States District Court, S.D. Florida": "us:c11:fl.sd",
	"United States District Court, E.D. New York": "us:c2:ny.ed",
	"United States District Court, S.D. West Virginia": "us:c4:wv.sd",
	"United States District Court, N.D. Alabama": "us:c11:al.nd",
	"United States District Court, D. South Dakota": "us:c8:sd.d",
	"United States District Court, D. New Hampshire": "us:c1:nh.d",
	"United States District Court, D. Kansas": "us:c10:ks.d",
	"United States District Court, D. Maryland": "us:c4:md.d",
	"United States District Court, D. Delaware": "us:c3:de.d",
	"United States District Court, E.D. Louisiana": "us:c5:la.ed",
	"United States District Court, M.D. Georgia": "us:c11:ga.md",
	"United States District Court, E.D. Michigan": "us:c6:mi.ed",
	"United States District Court, D. Utah": "us:c10:ut.d",
	"United States District Court, N.D. Texas": "us:c5:tx.nd",
	"United States District Court, S.D. New York": "us:c2:ny.sd",
	"United States District Court, W.D. Pennsylvania": "us:c3:pa.wd",
	"United States District Court, W.D. Texas": "us:c5:tx.wd",
	"United States District Court, D. Puerto Rico": "us:c1:pr.d",
	"United States District Court, N.D. Iowa": "us:c8:ia.nd",
	"United States District Court, E.D. Washington": "us:c9:wa.ed",
	"United States District Court, W.D. Kentucky": "us:c6:ky.wd",
	"United States District Court, N.D. Oklahoma": "us:c10:ok.nd",
	"United States District Court, M.D. Louisiana": "us:c5:la.md",
	"United States District Court, D. Rhode Island": "us:c1:ri.d",
	"United States District Court, S.D. Alabama": "us:c11:al.sd",
	"United States District Court, S.D. Georgia": "us:c11:ga.sd",
	"United States District Court, D. Connecticut": "us:c2:ct.d",
	"United States District Court, E.D. Kentucky": "us:c6:ky.ed",
	"United States District Court, W.D. North Carolina": "us:c4:nc.wd",
	"United States District Court, W.D. Virginia": "us:c4:va.wd",
	"United States District Court, S.D. Indiana": "us:c7:in.sd",
	"United States District Court, E.D. North Carolina": "us:c4:nc.ed",
	"United States District Court, S.D. California": "us:c9:ca.sd",
	"United States District Court, D. Minnesota": "us:c8:mn.d",
	"United States District Court, N.D. New York": "us:c2:ny.nd",
	"United States District Court, D. Nebraska": "us:c8:ne.d",
	"United States District Court, W.D. New York": "us:c2:ny.wd",
	"United States District Court, S.D. Iowa": "us:c8:ia.sd",
	"United States District Court, W.D. Washington": "us:c9:wa.wd",
	"United States District Court, D. Alaska": "us:c9:ak.d",
	"United States District Court, D. Idaho": "us:c9:id.d",
	"United States District Court, D. Wyoming": "us:c10:wy.d",
	"United States District Court, M.D. North Carolina": "us:c4:nc.md",
	"United States District Court, N.D. Illinois": "us:c7:il.nd",
	"United States District Court, N.D. Mississippi": "us:c5:ms.nd",
	"United States District Court, E.D. Texas": "us:c5:tx.ed",
	"United States District Court, E.D. Virginia": "us:c4:va.ed",
	"United States District Court, S.D. Mississippi": "us:c5:ms.sd",
	"United States District Court, D. North Dakota": "us:c8:nd.d",
	"United States District Court, E.D. Tennessee": "us:c6:tn.ed",
	"United States District Court, D. New Mexico": "us:c10:nm.d",
	"United States District Court, D. Montana": "us:c9:mt.d",
	"United States District Court, N.D. Ohio": "us:c6:oh.nd",
	"United States District Court, E.D. Missouri": "us:c8:mo.ed",
	"United States District Court, W.D. Oklahoma": "us:c10:ok.wd",
	"United States District Court, D. Colorado": "us:c10:co.d",
	"United States District Court, C.D. Illinois": "us:c7:il.cd",
	"United States District Court, D. Oregon": "us:c9:or.d",
	"United States District Court, E.D. Oklahoma": "us:c10:ok.ed",
	"United States District Court, D. District of Columbia": "us:cadc:dc.d",
	"United States District Court, N.D. Florida": "us:c11:fl.nd",
	"United States District Court, W.D. Missouri": "us:c8:mo.wd",
	"United States District Court, M.D. Pennsylvania": "us:c3:pa.md",
	"United States District Court, D. Hawaii": "us:c9:hi.d",
	"United States District Court, D. Nevada": "us:c9:nv.d",
	"United States District Court, N.D. California": "us:c9:ca.nd",
	"United States District Court, E.D. California": "us:c9:ca.ed",
	"United States District Court, W.D. Wisconsin": "us:c7:wi.wd",
	"United States District Court, W.D. Arkansas": "us:c8:ar.wd",
	"United States District Court, M.D. Tennessee": "us:c6:tn.md",
	"United States District Court, D. Vermont": "us:c2:vt.d",
	"United States District Court, N.D. West Virginia": "us:c4:wv.nd",
	"United States District Court, D. New Jersey": "us:c3:nj.d",
	"United States District Court, M.D. Alabama": "us:c11:al.md",
	"United States District Court, D. Arizona": "us:c9:az.d",
	"United States District Court, D. Massachusetts": "us:c1:ma.d",
	"United States District Court, S.D. Texas": "us:c5:tx.sd",
	"United States District Court, E.D. Pennsylvania": "us:c3:pa.ed",
	"United States District Court, N.D. Indiana": "us:c7:in.nd",
	"United States District Court, E.D. Wisconsin": "us:c7:wi.ed",
	"United States District Court, E.D. Arkansas": "us:c8:ar.ed",
	"United States District Court, W.D. Louisiana": "us:c5:la.wd",
	"United States District Court, M.D. Florida": "us:c11:fl.md",
	"United States District Court, C.D. California": "us:c9:ca.cd",
	"Supreme Court of the United States": "us"
};

//States

var staterex = /(?:^|.*\s+)(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)[.,]*(?:$|\s+.*)/;

var stateMap = {
	Alabama: "us:al",
	Alaska: "us:ak",
	Arizona: "us:az",
	Arkansas: "us:ar",
	California: "us:ca",
	Colorado: "us:co",
	Connecticut: "us:ct",
	Delaware: "us:de",
	Florida: "us:fl",
	Georgia: "us:ga",
	Hawaii: "us:hi",
	Idaho: "us:id",
	Illinois: "us:il",
	Indiana: "us:in",
	Iowa: "us:ia",
	Kansas: "us:ks",
	Kentucky: "us:ky",
	Louisiana: "us:la",
	Maine: "us:me",
	Maryland: "us:md",
	Massachusetts: "us:ma",
	Michigan: "us:mi",
	Minnesota: "us:mn",
	Mississippi: "us:ms",
	Missouri: "us:mo",
	Montana: "us:mt",
	Nebraska: "us:ne",
	Nevada: "us:nv",
	"New Hampshire": "us:nh",
	"New Jersey": "us:nj",
	"New Mexico": "us:nm",
	"New York": "us:ny",
	"North Carolina": "us:nc",
	"North Dakota": "us:nd",
	Ohio: "us:oh",
	Oklahoma: "us:ok",
	Oregon: "us:or",
	Pennsylvania: "us:pa",
	"Rhode Island": "us:ri",
	"South Carolina": "us:sc",
	"South Dakota": "us:sd",
	Tennessee: "us:tn",
	Texas: "us:tx",
	Utah: "us:ut",
	Vermont: "us:vt",
	Virginia: "us:va",
	Washington: "us:wa",
	"West Virginia": "us:wv",
	Wisconsin: "us:wi",
	Wyoming: "us:wy"
};

// Modern importer layer. These declarations intentionally supersede the legacy
// functions above while this translator is being rebuilt against saved fixtures.
function detectWeb(doc, url) {
	let profile = wlGetDocumentProfile(doc, url);
	return profile ? profile.itemType : false;
}

function doWeb(doc, url) {
	let profile = wlGetDocumentProfile(doc, url);
	if (!profile) {
		throw new Error("Unsupported Westlaw page: no document metadata found");
	}

	let item = new Zotero.Item(profile.itemType);
	let metadata = getMetadata(doc);
	let title = wlGetTitle(doc, metadata);
	let cite = wlGetCite(doc, metadata);
	item.url = westlawURL(doc, url, metadata);

	if (profile.kind === "case") {
		wlPopulateCase(item, doc, metadata);
	}
	else if (profile.kind === "statute" || profile.kind === "regulation") {
		wlPopulateCodeItem(item, doc, metadata, profile.kind);
	}
	else if (profile.kind === "sessionLaw") {
		wlPopulateSessionLaw(item, doc, metadata);
	}
	else if (profile.kind === "federalRegister") {
		wlPopulateFederalRegister(item, doc, metadata);
	}
	else if (profile.kind === "restatement") {
		wlPopulateRestatement(item, doc, metadata);
	}
	else if (profile.kind === "treatise") {
		wlPopulateTreatise(item, doc, metadata);
	}
	else if (profile.kind === "dictionary") {
		wlPopulateDictionaryEntry(item, doc, metadata);
	}
	else if (profile.kind === "article") {
		wlPopulateArticle(item, doc, metadata);
	}
	else {
		item.title = title || cite || "Westlaw Document";
		item.callNumber = cite || undefined;
	}

	wlAttachSnapshot(item, doc, url, metadata, profile);
	item.complete();
}

function wlPopulateCase(item, doc, metadata) {
	let citations = wlGetCaseCitations(doc, metadata);
	let selected = parseCitations(citations);
	let courtLine = wlGetCourtLine(doc, metadata);
	// Snapshot attachments now carry the useful rendered document and annotations.
	// Keep note generation code below for reference, but do not create notes by default.
	// let note = wlGetCaseNote(doc, selected[2] || citations[0] || "");

	item.caseName = wlGetTitle(doc, metadata);
	item.title = item.caseName;
	item.date = wlClean(metadata.dateFile || metadata.date || metadata.publicationDate || wlText(doc.querySelector(".co_docketDate .co_date")));
	item.filingDate = item.date;
	Object.assign(item, selected[0]);
	if (selected[1]) item.callNumber = selected[1];
	item.shortTitle = shortTitle(item.caseName);
	item.jurisdiction = parseJurisdiction(courtLine || metadata.jurisdictionText || metadata.jurisdiction || "");
	item.court = parseCourt(courtLine || metadata.court || "");
	// if (metadata.judge && !note) item.notes.push({ note: "<p>" + wlEscape(metadata.judge) + "</p>" });
	// if (note) item.notes.push({ note: note });
	if (wlIsUnpublished(doc)) item.setExtra("Unpublished", "true");
	if (wlHasNegativeHistory(doc)) item.setExtra("hasNegativeHistory", "true");
}

function wlPopulateCodeItem(item, doc, metadata, kind) {
	let cite = wlGetCite(doc, metadata);
	let parsed = wlParseCodeCitation(cite);
	let title = wlGetTitle(doc, metadata);
	item.title = wlCodeItemTitle(title, parsed);
	item.code = parsed.code || (kind === "regulation" ? "Regulation" : "Statute");
	item.codeNumber = parsed.codeNumber;
	item.section = parsed.section || cite;
	item.jurisdiction = wlCodeJurisdiction(parsed, metadata);
	let effectiveDate = wlCodeEffectiveDate(doc, metadata);
	item.publicationDate = effectiveDate;
	// let note = wlBuildCodeNote(doc, item.title, wlGetCodeBody(doc), effectiveDate);
	// if (note) item.notes.push({ note: note });
}

function wlPopulateSessionLaw(item, doc, metadata) {
	item.title = wlGetTitle(doc, metadata);
	item.code = "North Carolina Session Laws";
	item.section = wlGetCite(doc, metadata);
	item.date = metadata.date || metadata.publicationDate || "";
	item.callNumber = wlGetCite(doc, metadata);
}

function wlPopulateFederalRegister(item, doc, metadata) {
	let cite = wlGetCite(doc, metadata);
	let parsed = wlParseFederalRegisterCitation(cite);
	let title = wlGetTitle(doc, metadata);
	item.title = title;
	item.nameOfAct = title;
	item.code = "Federal Register";
	if (parsed.volume) item.codeNumber = parsed.volume;
	if (parsed.pages) item.pages = parsed.pages;
	item.dateEnacted = wlFederalRegisterDate(doc, metadata);
	item.jurisdiction = "us";
	item.publisher = wlFederalRegisterAgency(doc);
	item.extra = wlFederalRegisterExtra(doc);
	// let note = wlGetHighlightedDocumentNote(doc, wlGetDocumentRoot(doc), { includeHeadings: true });
	// if (note) item.notes.push({ note: note });
}

function wlPopulateRestatement(item, doc, metadata) {
	let cite = wlGetCite(doc, metadata);
	let parsed = wlParseRestatementCitation(cite);
	item.title = wlSectionTitle(wlGetTitle(doc, metadata), parsed.section);
	item.bookTitle = wlRestatementBookTitle(doc, parsed.code || cite);
	item.section = parsed.section;
	item.date = parsed.year || wlNormalizeSecondaryDate(metadata.date || metadata.publicationDate || wlText(doc.querySelector(".co_publicationLine .co_date")));
	item.callNumber = cite;
	// let note = wlGetRestatementNote(doc, item.title);
	// if (note) item.notes.push({ note: note });
}

function wlPopulateTreatise(item, doc, metadata) {
	let cite = wlGetCite(doc, metadata);
	let parsed = wlParseTreatiseCitation(cite, wlGetTitle(doc, metadata));
	item.title = wlSectionTitle(wlGetTitle(doc, metadata), parsed.section);
	let bookTitle = wlTreatiseBookTitle(doc, metadata);
	let citationTitle = wlTreatiseBookTitleFromCitation(cite);
	if (wlShouldPreferTreatiseCitationTitle(bookTitle, citationTitle)) {
		bookTitle = citationTitle;
	}
	item.bookTitle = wlCommentaryBookTitle(bookTitle, parsed.volume);
	item.section = parsed.section || cite;
	item.volume = parsed.volume;
	item.edition = parsed.edition;
	item.date = parsed.date || wlTreatiseDate(doc, metadata);
	item.callNumber = cite;
	let author = wlText(doc.querySelector("#author"));
	if (wlLooksLikePersonalCreator(author)) wlAddCreator(item, author);
	// let note = wlGetHighlightedDocumentNote(doc, wlGetDocumentRoot(doc), { includeHeadings: true });
	// if (note) item.notes.push({ note: note });
}

function wlPopulateDictionaryEntry(item, doc, metadata) {
	let cite = wlGetCite(doc, metadata);
	let parsed = wlParseDictionaryCitation(cite);
	item.title = wlGetTitle(doc, metadata);
	item.dictionaryTitle = parsed.title || wlClean(cite);
	item.edition = parsed.edition;
	item.date = parsed.year;
	item.callNumber = cite;
}

function wlPopulateArticle(item, doc, metadata) {
	item.title = wlGetTitle(doc, metadata);
	item.publicationTitle = wlText(doc.querySelector("#pubname")) || wlFirstHeadtext(doc) || metadata.functionalCite || "";
	item.date = metadata.date || metadata.publicationDate || wlText(doc.querySelector(".co_date"));
	item.pages = wlArticlePages(wlGetCite(doc, metadata));
	item.callNumber = wlGetCite(doc, metadata);
	wlAddCreator(item, wlText(doc.querySelector("#author")));
	// let note = wlGetHighlightedDocumentNote(doc, wlGetDocumentRoot(doc), { includeHeadings: true });
	// if (note) item.notes.push({ note: note });
}

function wlGetDocumentProfile(doc, url) {
	let root = wlGetDocumentRoot(doc);
	let metadata = getMetadata(doc);
	if (wlIsUnsupportedWestlawPage(doc, url, root, metadata)) return false;
	if (!root && !wlDocumentGuid(doc, url, metadata)) return false;

	let title = (doc.title || "").toLowerCase();
	let cite = wlGetCite(doc, metadata);
	let rootClass = root ? root.className : "";
	let contentType = (metadata.contentType || metadata.ContentType || "").toLowerCase();
	let subContentType = (metadata.subContentType || metadata.SubContentType || "").toLowerCase();

	if (title.includes("| cases |") || contentType === "cases" || rootClass.includes("co_caselaw")) {
		return { kind: "case", itemType: "case" };
	}
	if (title.includes("historical session laws") || rootClass.includes("co_codesSessionLaws")) {
		return { kind: "sessionLaw", itemType: "statute" };
	}
	if (title.includes("pending/proposed regulations") || rootClass.includes("co_federalRegister") || /\bFR\b/.test(cite)) {
		return { kind: "federalRegister", itemType: "gazette" };
	}
	if (title.includes("| statutes |") || rootClass.includes("co_codesStatutes") || contentType === "statutes") {
		return { kind: "statute", itemType: "statute" };
	}
	if (title.includes("| regulations |") || rootClass.includes("co_codesStateAdminCodes") || contentType === "regulations") {
		return { kind: "regulation", itemType: "regulation" };
	}
	if (wlIsRestatementLike(cite, title, subContentType)) {
		return { kind: "restatement", itemType: "legalCommentary" };
	}
	if (title.includes("| secondary sources |") || rootClass.includes("co_commentary")) {
		if (wlIsDictionaryLike(cite, title, subContentType)) return { kind: "dictionary", itemType: "dictionaryEntry" };
		if (cite.includes("§")) return { kind: "treatise", itemType: "legalCommentary" };
		return { kind: "article", itemType: "journalArticle" };
	}
	return { kind: "document", itemType: "document" };
}

function getMetadata(doc) {
	let input = doc.querySelector('[id^="co_document_metaInfo"]');
	if (!input) return {};
	let raw = input.value || input.getAttribute("value") || "";
	let parsed = wlParseJSON(raw);
	if (parsed && parsed.metaInformation) {
		Object.assign(parsed, parsed.metaInformation);
	}
	return parsed || {};
}

function westlawURL(itemOrDoc, url, metadata) {
	let metadataObj = metadata || {};
	if (itemOrDoc && itemOrDoc.querySelector) metadataObj = getMetadata(itemOrDoc);
	let guid = wlDocumentGuid(itemOrDoc && itemOrDoc.querySelector ? itemOrDoc : null, url, metadataObj);
	if (guid) {
		return "https://1.next.westlaw.com/Document/" + guid + "/View/FullText.html";
	}
	return wlCleanWestlawURL(url || "");
}

function wlDocumentGuid(doc, url, metadata) {
	metadata = metadata || (doc ? getMetadata(doc) : {});
	let guid = metadata.docGuid || metadata.DocGuid || metadata.documentGuid || metadata.DocumentGuid;
	if (guid) return guid;
	let urlMatch = (url || "").match(/\/Document\/([^/?#]+)/i);
	if (urlMatch) return urlMatch[1];
	let link = doc && doc.querySelector ? doc.querySelector("a[href*='/Document/'][href*='/View/FullText']") : null;
	let linkMatch = link ? (link.href || link.getAttribute("href") || "").match(/\/Document\/([^/?#]+)/i) : null;
	return linkMatch ? linkMatch[1] : "";
}

function wlCleanWestlawURL(url) {
	let match = (url || "").match(/^(https?:\/\/[^?#]+\/Document\/[^/?#]+\/View\/FullText\.html)(?:[?#].*)?$/i);
	return match ? match[1] : url;
}

function wlIsUnsupportedWestlawPage(doc, url, root, metadata) {
	if (root || wlDocumentGuid(doc, url, metadata)) return false;
	let title = wlClean(doc.title || "").toLowerCase();
	if (/search results|advanced search|folder|history|favorites|browse|category page|document list/.test(title)) return true;
	return !!doc.querySelector("#co_searchResults, .search-results, .SearchResults, [class*='SearchResult'], [id*='SearchResult']");
}

function wlGetCaseCitations(doc, metadata) {
	let citations = Array.from(doc.querySelectorAll("#co_docHeaderCitation [id^='cite'], #co_docHeaderCitation #cite")).map(wlText).filter(Boolean);
	if (metadata.functionalCite && !citations.includes(metadata.functionalCite)) citations.unshift(metadata.functionalCite);
	if (metadata.parallelCitations && metadata.parallelCitations.length) citations.push(...metadata.parallelCitations);
	if (!citations.length) citations = [wlGetCite(doc, metadata)].filter(Boolean);
	return citations;
}

function parseCitations(citationArray) {
	let result = {};
	let vendorNeutralCitation = false;
	let citationObjects = [];
	for (let citation of citationArray) {
		let clean = wlClean(citation);
		let match = clean.match(/^(\d{1,4})(?:\s+|-)([A-Za-z][A-Za-z0-9.\s-]*?)(?:\s+|-)(\d+)(?=,|\s|$)/);
		if (!match) continue;
		let reporter = wlNormalizeReporter(match[2]);
		let parsed = { citation: clean, volume: match[1], reporter: reporter, page: match[3] };
		if (wlIsVendorNeutralReporter(reporter)) vendorNeutralCitation = clean;
		citationObjects.push(parsed);
	}
	if (!citationObjects.length) return [result, vendorNeutralCitation];

	let selected = citationObjects[0];
	for (let preferred of preferredReporters) {
		let found = citationObjects.find(c => wlReporterKey(c.reporter) === wlReporterKey(preferred[0]));
		if (found) {
			selected = found;
			break;
		}
	}
	if (wlReporterKey(selected.reporter) === "wl" || wlIsVendorNeutralReporter(selected.reporter)) {
		result.yearAsVolume = selected.volume;
		result.archive = selected.reporter;
		result.archiveLocation = selected.page;
	}
	else {
		result.volume = selected.volume;
		result.reporter = selected.reporter;
		result.firstPage = selected.page;
	}
	return [result, vendorNeutralCitation, selected.citation];
}

function wlNormalizeReporter(reporter) {
	return wlClean(reporter).replace(/\s+/g, " ");
}

function wlReporterKey(reporter) {
	return wlNormalizeReporter(reporter).replace(/\s+/g, "").toLowerCase();
}

function wlIsVendorNeutralReporter(reporter) {
	let key = wlReporterKey(reporter);
	return vendorNeutralReporters.some(r => wlReporterKey(r) === key);
}

function parseJurisdiction(court) {
	court = wlClean(court);
	if (!court) return undefined;
	let normalizedCourt = court.replace(/,\s*[A-Za-z ]*Division\.?.*/i, "").replace(/\.+$/g, "");
	let federalJurisdiction = wlFederalJurisdiction(normalizedCourt);
	if (federalJurisdiction) return federalJurisdiction;
	if (fedMap[normalizedCourt]) return fedMap[normalizedCourt];
	if (/North Carolina|N\.C\./i.test(court)) return "us:nc";
	if (/United States|U\.S\./i.test(court)) return "us";
	let stateMatch = court.match(staterex);
	return stateMatch ? stateMap[stateMatch[1]] : undefined;
}

function wlFederalJurisdiction(court) {
	let canonical = wlCanonicalFederalCourt(court);
	return canonical && fedMap[canonical] ? fedMap[canonical] : undefined;
}

function wlCanonicalFederalCourt(court) {
	court = wlClean(court).replace(/\.+$/g, "");
	court = court.replace(/,\s*[A-Za-z ]*Division$/i, "");
	if (/^(?:United States\s+)?District Court,\s+District of Columbia$/i.test(court)) {
		return "United States District Court, D. District of Columbia";
	}
	let match = court.match(/^(?:United States\s+)?District Court,\s+((?:[CEMNSW]\.)?D\.)\s+(.+)$/i);
	if (!match) return "";
	let district = match[1].toUpperCase();
	let state = wlCanonicalStateName(match[2]);
	if (!state) return "";
	return "United States District Court, " + district + " " + state;
}

function wlCanonicalStateName(state) {
	state = wlClean(state).replace(/\.+$/g, "");
	for (let name in stateMap) {
		if (name.toLowerCase() === state.toLowerCase()) return name;
	}
	return "";
}

function parseCourt(court) {
	court = wlClean(court);
	if (/Supreme/i.test(court)) return "supreme.court";
	if (/Court of Appeals|Appeals/i.test(court)) return "court.appeals";
	if (/District Court|D\.[A-Z]/i.test(court)) return "district.court";
	if (/Superior/i.test(court)) return "superior.court";
	return undefined;
}

function shortTitle(caseName) {
	let vStart = caseName ? caseName.indexOf(" v. ") : -1;
	if (vStart === -1) return "";
	let parties = [caseName.slice(0, vStart), caseName.slice(vStart + 4)];
	if (parties[0].length - parties[1].length > 9) parties.reverse();
	if (!govPattern.test(parties[0])) return shortParty(parties[0]);
	if (!govPattern.test(parties[1])) return shortParty(parties[1]);
	return "";
}

function shortParty(p) {
	while (trimPattern.test(p)) p = p.replace(trimPattern, "");
	return wlClean(p);
}

function wlBuildCodeNote(doc, title, root, effectiveDate) {
	if (!root) return "";
	let wrapper = doc.createElement("div");
	if (title) {
		let heading = doc.createElement("h4");
		heading.textContent = title;
		wrapper.appendChild(heading);
	}
	if (effectiveDate) {
		let date = doc.createElement("p");
		date.textContent = "Effective: " + effectiveDate;
		wrapper.appendChild(date);
	}
	for (let node of root.children) {
		if (wlShouldStopCodeNode(node)) break;
		wlAppendCodeNode(doc, wrapper, node);
	}
	return wlNoteHTML(wrapper);
}

function wlAttachSnapshot(item, doc, url, metadata, profile) {
	let snapshotContent = wlBuildSnapshotHTML(doc, item, url, metadata, profile);
	if (!snapshotContent) return;
	item.attachments.push({
		title: "Westlaw Snapshot",
		url: item.url || westlawURL(doc, url, metadata),
		mimeType: "text/html",
		snapshotContent
	});
}

function wlBuildSnapshotHTML(doc, item, url, metadata, profile) {
	let root = wlGetDocumentRoot(doc);
	if (!root) return "";

	let snapshotDoc = doc.implementation.createHTMLDocument(item.title || wlGetTitle(doc, metadata) || "Westlaw Document");
	snapshotDoc.documentElement.setAttribute("lang", "en");
	wlAppendSnapshotHead(snapshotDoc, item, url, metadata);
	let body = snapshotDoc.body;
	body.className = "westlaw-snapshot juris-lit-semantic-snapshot";

	let main = snapshotDoc.createElement("main");
	main.className = "document";
	body.appendChild(main);
	wlAppendSnapshotHeader(snapshotDoc, main, item, doc, url, metadata);

	if (profile.kind === "case") {
		wlAppendCaseSnapshot(doc, snapshotDoc, main, item);
	}
	else if (profile.kind === "restatement") {
		wlAppendRestatementSnapshot(doc, snapshotDoc, main, root);
	}
	else {
		wlAppendGenericSnapshot(doc, snapshotDoc, main, root);
	}

	return wlClean(main.textContent) ? "<!DOCTYPE html>\n" + snapshotDoc.documentElement.outerHTML : "";
}

function wlAppendSnapshotHead(snapshotDoc, item, url, metadata) {
	let head = snapshotDoc.head;
	let meta = snapshotDoc.createElement("meta");
	meta.setAttribute("charset", "utf-8");
	head.appendChild(meta);
	let title = snapshotDoc.createElement("title");
	title.textContent = item.title || "Westlaw Snapshot";
	head.appendChild(title);
	let canonical = snapshotDoc.createElement("meta");
	canonical.setAttribute("name", "juris-lit-source-url");
	canonical.setAttribute("content", item.url || westlawURL(snapshotDoc, url, metadata));
	head.appendChild(canonical);
	let style = snapshotDoc.createElement("style");
	style.textContent = wlSnapshotCSS();
	head.appendChild(style);
}

function wlAppendSnapshotHeader(snapshotDoc, wrapper, item, sourceDoc, url, metadata) {
	let header = snapshotDoc.createElement("header");
	header.className = "documentHeader";
	let title = snapshotDoc.createElement("h1");
	title.textContent = item.title || wlGetTitle(sourceDoc, metadata) || "Westlaw Document";
	header.appendChild(title);

	let cite = wlGetCite(sourceDoc, metadata) || item.callNumber;
	if (cite) {
		let citation = snapshotDoc.createElement("p");
		citation.className = "citation";
		citation.textContent = cite;
		header.appendChild(citation);
	}

	let sourceURL = item.url || westlawURL(sourceDoc, url, metadata);
	if (sourceURL) {
		let source = snapshotDoc.createElement("p");
		source.className = "source";
		source.appendChild(snapshotDoc.createTextNode("Source: "));
		let link = snapshotDoc.createElement("a");
		link.href = sourceURL;
		link.textContent = sourceURL;
		source.appendChild(link);
		header.appendChild(source);
	}
	wrapper.appendChild(header);
}

function wlAppendCaseSnapshot(doc, snapshotDoc, wrapper, item) {
	let selectedCitation = item.volume && item.reporter && item.firstPage
		? item.volume + " " + item.reporter + " " + item.firstPage
		: item.callNumber || "";
	let opinions = wlCaseOpinions(doc);
	let annotationIndex = { value: 0 };
	for (let i = 0; i < opinions.length; i++) {
		let opinionData = opinions[i];
		let section = snapshotDoc.createElement("section");
		section.className = "opinion " + wlOpinionSnapshotClass(opinionData, i);
		let heading = snapshotDoc.createElement("h2");
		heading.textContent = wlOpinionLabel(opinionData, i);
		section.appendChild(heading);
		let author = wlOpinionAuthor(opinionData.container);
		if (author) {
			let authorNode = snapshotDoc.createElement("p");
			authorNode.className = "opinionAuthor";
			authorNode.setAttribute("data-juris-lit-condensed-head", "opinion-author");
			authorNode.textContent = author;
			section.appendChild(authorNode);
		}
		let pageIndex = wlPageMarkerIndex(doc, opinionData.container || opinionData.body, selectedCitation);
		wlAppendSnapshotContent(doc, snapshotDoc, opinionData.body, section, {
			pageIndex,
			includedParagraphs: [],
			includedFootnotes: [],
			annotationIndex
		});
		if (wlClean(section.textContent)) wrapper.appendChild(section);
	}
}

function wlAppendGenericSnapshot(doc, snapshotDoc, wrapper, root) {
	wlAppendSnapshotContent(doc, snapshotDoc, root, wrapper, {
		pageIndex: null,
		includedParagraphs: [],
		includedFootnotes: [],
		annotationIndex: { value: 0 }
	});
}

function wlAppendRestatementSnapshot(doc, snapshotDoc, wrapper, root) {
	let section = wlGetSectionRoot(doc) || root;
	let boundary = wlRestatementBoundaryNode(section);
	let caseCitationsBoundary = wlRestatementCaseCitationsNode(section);
	let ruleBoundary = wlRestatementCommentNode(section) || boundary;
	let rule = wlRestatementRuleRoot(section, ruleBoundary);
	let ruleParagraphs = rule ? wlRestatementRuleParagraphs(rule, ruleBoundary) : [];
	wlAppendSnapshotContent(doc, snapshotDoc, root, wrapper, {
		pageIndex: null,
		includedParagraphs: [],
		includedFootnotes: [],
		annotationIndex: { value: 0 },
		condensedHeadParagraphs: ruleParagraphs,
		boundaryNode: caseCitationsBoundary
	});
}

function wlAppendSnapshotContent(doc, snapshotDoc, root, wrapper, options) {
	for (let node of Array.from(root.children)) {
		if (options.boundaryNode && wlNodeAtOrAfter(options.boundaryNode, node)) continue;
		if (wlShouldSkipSnapshotNode(node)) continue;
		if (node.classList && node.classList.contains("co_paragraphText")) {
			wlAppendSnapshotParagraph(doc, snapshotDoc, wrapper, node, options);
			continue;
		}
		if (node.classList && node.classList.contains("co_headtext")) {
			wrapper.append(...wlSanitizeNode(node, snapshotDoc, options.pageIndex, { snapshot: true, annotationIndex: options.annotationIndex }));
			continue;
		}
		if (node.tagName === "UL" || node.tagName === "OL") {
			wrapper.append(...wlSanitizeNode(node, snapshotDoc, options.pageIndex, { snapshot: true, annotationIndex: options.annotationIndex }));
			continue;
		}
		wlAppendSnapshotContent(doc, snapshotDoc, node, wrapper, options);
	}
}

function wlAppendSnapshotParagraph(doc, snapshotDoc, wrapper, paragraph, options) {
	if (options.includedParagraphs.includes(paragraph)) return;
	let sanitized = wlSanitizeNode(paragraph, snapshotDoc, options.pageIndex, { snapshot: true, annotationIndex: options.annotationIndex });
	wlEnsureLeadingPageNumber(sanitized, wlGoverningPageNumber(options.pageIndex, paragraph), snapshotDoc);
	if (options.condensedHeadParagraphs && options.condensedHeadParagraphs.includes(paragraph)) {
		for (let node of sanitized) {
			if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "P") {
				node.setAttribute("data-juris-lit-condensed-head", "restatement-rule");
			}
		}
	}
	wrapper.append(...sanitized);
	options.includedParagraphs.push(paragraph);

	for (let footnote of wlFootnotesForNode(paragraph, doc)) {
		if (options.includedFootnotes.includes(footnote)) continue;
		wrapper.appendChild(wlSanitizeFootnote(footnote, snapshotDoc, options.pageIndex, { snapshot: true, annotationIndex: options.annotationIndex }));
		options.includedFootnotes.push(footnote);
	}
}

function wlShouldSkipSnapshotNode(node) {
	if (!node || node.nodeType !== Node.ELEMENT_NODE) return true;
	let cls = node.className || "";
	let id = node.id || "";
	return wlSkipElement(node)
		|| wlIsInsideExcludedBlock(node)
		|| wlIsInsideFootnote(node)
		|| wlShouldStopCodeNode(node)
		|| /\b(?:co_search|search|sidebar|navigation|toolbar|toc|result|filter)\b/i.test(cls + " " + id);
}

function wlOpinionSnapshotClass(opinionData, index) {
	let kind = wlOpinionKind(opinionData, index);
	if (kind === "concurrence-dissent") return "concurrence dissent";
	if (kind === "concurrence") return "concurrence";
	if (kind === "dissent") return "dissent";
	if (kind === "separate") return "separate";
	return "majority";
}

function wlSnapshotCSS() {
	return [
		"html { background: #faf6ee; }",
		"body { margin: 0; color: #241f1a; background: #faf6ee; font-family: Georgia, 'Times New Roman', serif; font-size: var(--juris-lit-note-font-size, 17px); line-height: 1.55; }",
		".document { max-width: 780px; margin: 0 auto; padding: 3rem 2rem 4rem; }",
		".documentHeader { border-bottom: 1px solid #d8cdbd; margin-bottom: 2rem; padding-bottom: 1rem; }",
		"h1 { font-size: 1.65em; line-height: 1.25; margin: 0 0 .75rem; }",
		"h2 { font-size: 1.2em; margin: 2rem 0 .75rem; }",
		"h4 { font-size: 1em; margin: 1.3rem 0 .45rem; text-transform: uppercase; letter-spacing: .04em; }",
		"p { margin: .7rem 0; }",
		".citation, .source, .opinionAuthor { color: #665b4d; font-size: .92em; }",
		".source a { color: inherit; text-decoration: underline; text-decoration-thickness: .06em; text-underline-offset: .12em; }",
		".opinion { margin: 1.5rem 0; }",
		".opinion.concurrence { background: #edf7fb; border-left: 4px solid #9dc9dd; padding: 1rem 1.25rem; }",
		".opinion.dissent { background: #fff0ee; border-left: 4px solid #e2a199; padding: 1rem 1.25rem; }",
		".opinion.separate { background: #f2f2f2; border-left: 4px solid #c9c9c9; padding: 1rem 1.25rem; }",
		".pageNumber { color: #745c35; font-weight: 700; margin-right: .2rem; }",
		".prefixPageNumber { color: #8a7d6c; font-size: .88em; font-weight: 400; }",
		".footnote { color: #51483c; font-size: .9em; margin: .25rem 0 .9rem 2rem; }",
		".footnoteNumber { color: #745c35; font-weight: 700; }",
		"blockquote { border-left: 3px solid #d8cdbd; margin: .8rem 0 .8rem 1.2rem; padding-left: 1rem; }"
	].join("\n");
}

function wlAppendCodeNode(doc, wrapper, node) {
	if (!node || node.nodeType !== Node.ELEMENT_NODE || wlShouldStopCodeNode(node) || wlSkipElement(node)) return;
	if (node.classList && node.classList.contains("co_paragraphText")) {
		let paragraphs = wlSanitizeNode(node, doc).filter(child => child.nodeType === Node.ELEMENT_NODE);
		for (let paragraph of paragraphs) {
			if (paragraph.tagName === "P") {
				let style = wlCodeParagraphStyle(node);
				if (style) paragraph.setAttribute("style", style);
			}
			wrapper.appendChild(paragraph);
		}
		return;
	}
	if (node.classList && node.classList.contains("co_headtext")) {
		wrapper.append(...wlSanitizeNode(node, doc));
		return;
	}
	for (let child of node.children) wlAppendCodeNode(doc, wrapper, child);
}

function wlShouldStopCodeNode(node) {
	if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
	let cls = node.className || "";
	let text = wlText(node);
	return wlShouldStopAtCitationBlock(node)
		|| node.id === "co_anchor_Credits"
		|| node.id === "co_notesOfDecisions"
		|| node.id === "co_footnoteSection"
		|| cls.includes("co_notesOfDecisions")
		|| cls.includes("co_footnoteSection")
		|| cls.includes("co_includeCurrencyBlock")
		|| (/^Credits$/i.test(text) && cls.includes("co_printHeading"));
}

function wlCodeParagraphStyle(node) {
	return wlIndentStyle(node, wlCodeParagraphDepth(node));
}

function wlCodeParagraphDepth(node) {
	return Math.max(wlCodeSubsectionDepth(node), wlListParagraphDepth(node));
}

function wlCodeSubsectionDepth(node) {
	let depth = 0;
	let current = node.parentElement;
	while (current && !(current.classList && current.classList.contains("co_body"))) {
		if (current.classList && current.classList.contains("co_subsection")) depth++;
		current = current.parentElement;
	}
	return Math.max(depth - 1, 0);
}

function wlListParagraphDepth(node) {
	let depth = 0;
	let current = node.parentElement;
	while (current && !(current.classList && (current.classList.contains("co_body") || current.classList.contains("co_section")))) {
		if (current.tagName === "LI") depth++;
		current = current.parentElement;
	}
	return Math.max(depth - 1, 0);
}

function wlGetHighlightedDocumentNote(doc, root, options) {
	if (!root) return "";
	options = options || {};
	let wrapper = doc.createElement("div");
	wlAppendHighlightedParagraphs(doc, root, wrapper, options.excludedRoot || null, options.pageIndex || null, options);
	return wlNoteHTML(wrapper);
}

function wlAppendHighlightedParagraphs(doc, root, wrapper, excludedRoot, pageIndex, options) {
	options = options || {};
	let includedParagraphs = [];
	let includedFootnotes = [];
	let includedHeadings = [];
	for (let paragraph of Array.from(root.querySelectorAll(".co_paragraphText"))) {
		if (wlIsInsideExcludedBlock(paragraph)) continue;
		if (excludedRoot && excludedRoot.contains(paragraph)) continue;
		if (wlIsExcludedNode(paragraph, options.excludedNodes)) continue;
		if (wlShouldSkipHighlightedNode(paragraph, options)) continue;
		if (wlIsInsideFootnote(paragraph)) continue;
		let footnotes = wlFootnotesForNode(paragraph, doc)
			.filter(footnote => !wlShouldSkipHighlightedNode(footnote, options));
		let paragraphHighlighted = wlHasMeaningfulHighlight(paragraph);
		let highlightedFootnotes = footnotes.filter(wlHasMeaningfulHighlight);
		if (!paragraphHighlighted && !highlightedFootnotes.length) continue;
		if (options.includeHeadings) wlAppendHeadingContext(doc, wrapper, paragraph, root, includedHeadings);
		wlAppendParagraphAndFootnotes(doc, wrapper, paragraph, paragraphHighlighted ? footnotes : highlightedFootnotes, includedParagraphs, includedFootnotes, pageIndex);
	}
	for (let footnote of Array.from(root.querySelectorAll(".co_footnoteBody")).map(wlFootnoteContainer).filter(Boolean)) {
		if (!wlHasMeaningfulHighlight(footnote) || includedFootnotes.includes(footnote)) continue;
		if (wlShouldSkipHighlightedNode(footnote, options)) continue;
		let paragraph = wlParagraphForFootnote(footnote, doc);
		if (!paragraph || wlIsInsideExcludedBlock(paragraph)) continue;
		if (excludedRoot && excludedRoot.contains(paragraph)) continue;
		if (wlIsExcludedNode(paragraph, options.excludedNodes)) continue;
		if (wlShouldSkipHighlightedNode(paragraph, options)) continue;
		if (options.includeHeadings) wlAppendHeadingContext(doc, wrapper, paragraph, root, includedHeadings);
		wlAppendParagraphAndFootnotes(doc, wrapper, paragraph, [footnote], includedParagraphs, includedFootnotes, pageIndex);
	}
}

function wlIsExcludedNode(node, excludedNodes) {
	return !!(excludedNodes && excludedNodes.some(excluded => excluded === node || excluded.contains(node)));
}

function wlShouldSkipHighlightedNode(node, options) {
	if (!options) return false;
	if (options.boundaryNode && wlNodeAtOrAfter(options.boundaryNode, node)) return true;
	return options.skipNode ? options.skipNode(node) : false;
}

function wlAppendHeadingContext(doc, wrapper, paragraph, root, includedHeadings) {
	for (let heading of wlHeadingContext(paragraph, root)) {
		let key = wlClean(heading.textContent);
		if (!key || includedHeadings.includes(key)) continue;
		wrapper.append(...wlSanitizeNode(heading, doc));
		includedHeadings.push(key);
	}
}

function wlHeadingContext(paragraph, root) {
	let headings = [];
	let current = paragraph.parentElement;
	while (current && current !== root && root.contains(current)) {
		let heading = wlNearestPrecedingHeading(current);
		if (heading && !headings.includes(heading)) headings.unshift(heading);
		current = current.parentElement;
	}
	return headings;
}

function wlNearestPrecedingHeading(node) {
	let current = node;
	while (current) {
		let previous = current.previousElementSibling;
		while (previous) {
			let heading = wlLastHeading(previous);
			if (heading) return heading;
			previous = previous.previousElementSibling;
		}
		current = current.parentElement;
		if (!current || (current.id && current.id === "co_document_0")) break;
	}
	return null;
}

function wlLastHeading(node) {
	if (!node || !node.querySelectorAll) return null;
	if (node.classList && node.classList.contains("co_headtext")) return node;
	let headings = Array.from(node.querySelectorAll(".co_headtext, h1, h2, h3, h4"));
	return headings.length ? headings[headings.length - 1] : null;
}

function wlAppendParagraphAndFootnotes(doc, wrapper, paragraph, footnotes, includedParagraphs, includedFootnotes, pageIndex) {
	if (!includedParagraphs.includes(paragraph)) {
		let sanitized = wlSanitizeNode(paragraph, doc, pageIndex);
		wlEnsureLeadingPageNumber(sanitized, wlGoverningPageNumber(pageIndex, paragraph), doc);
		wrapper.append(...sanitized);
		includedParagraphs.push(paragraph);
	}
	for (let footnote of footnotes) {
		if (includedFootnotes.includes(footnote)) continue;
		wrapper.appendChild(wlSanitizeFootnote(footnote, doc, pageIndex));
		includedFootnotes.push(footnote);
	}
}

function wlGetRestatementNote(doc, title) {
	let section = wlGetSectionRoot(doc);
	if (!section) return "";
	let wrapper = doc.createElement("div");
	if (title) {
		let heading = doc.createElement("h4");
		heading.textContent = title;
		wrapper.appendChild(heading);
	}
	let boundary = wlRestatementBoundaryNode(section);
	let ruleBoundary = wlRestatementCommentNode(section) || boundary;
	let rule = wlRestatementRuleRoot(section, ruleBoundary);
	let ruleParagraphs = rule ? wlRestatementRuleParagraphs(rule, ruleBoundary) : [];
	if (ruleParagraphs.length) wlAppendRestatementRule(doc, wrapper, ruleParagraphs);
	let highlighted = doc.createElement("div");
	wlAppendHighlightedParagraphs(doc, section, highlighted, null, null, {
		includeHeadings: true,
		boundaryNode: boundary,
		excludedNodes: ruleParagraphs,
		skipNode: wlIsRestatementExcludedNode
	});
	wrapper.append(...Array.from(highlighted.childNodes));
	return wlNoteHTML(wrapper);
}

function wlGetCaseNote(doc, selectedCitation) {
	let wrapper = doc.createElement("div");
	let opinions = wlCaseOpinions(doc);
	for (let i = 0; i < opinions.length; i++) {
		let opinionData = opinions[i];
		let opinion = wlBuildOpinionNote(doc, opinionData, selectedCitation);
		if (!opinion || !opinion.childNodes.length) continue;
		let heading = doc.createElement("h3");
		heading.textContent = wlOpinionLabel(opinionData, i);
		wrapper.appendChild(heading);
		let author = wlOpinionAuthor(opinionData.container);
		if (author) {
			let authorNode = doc.createElement("p");
			authorNode.className = "opinionAuthor";
			authorNode.textContent = author;
			wrapper.appendChild(authorNode);
		}
		wrapper.append(...Array.from(opinion.childNodes));
	}
	return wlNoteHTML(wrapper);
}

function wlBuildOpinionNote(doc, opinionData, selectedCitation) {
	let holder = doc.createElement("div");
	let pageIndex = wlPageMarkerIndex(doc, opinionData.container || opinionData.body, selectedCitation);
	wlAppendHighlightedParagraphs(doc, opinionData.body, holder, null, pageIndex);
	return holder;
}

function wlAppendRestatementRule(doc, wrapper, paragraphs) {
	for (let paragraph of paragraphs) {
		if (wlSkipElement(paragraph)) continue;
		for (let node of wlSanitizeNode(paragraph, doc, null, { stripStrong: true })) {
			if (node.tagName === "P") {
				let style = wlCodeParagraphStyle(paragraph);
				if (style) node.setAttribute("style", style);
			}
			wrapper.appendChild(node);
		}
	}
}

function wlCaseOpinions(doc) {
	let opinions = [];
	for (let block of Array.from(doc.querySelectorAll(".co_opinionBlock"))) {
		for (let body of Array.from(block.querySelectorAll(".x_opinionBody")).filter(body => !body.closest(".x_opinionCipdip"))) {
			if (body.closest(".CipDipContent, .x_opinionConcurrence, .x_opinionDissent")) continue;
			opinions.push({
				body: body,
				block: block,
				container: wlOpinionContainer(body, block),
				kind: "majority"
			});
		}
		for (let cipdip of Array.from(block.querySelectorAll(".x_opinionCipdip"))) {
			let body = cipdip.querySelector(".x_opinionBody");
			if (!body) continue;
			opinions.push({
				body: body,
				block: block,
				container: cipdip,
				kind: "cipdip"
			});
		}
		for (let container of Array.from(block.querySelectorAll(".x_opinionConcurrence, .x_opinionDissent"))) {
			let body = container.querySelector(".x_opinionBody");
			if (!body) continue;
			opinions.push({
				body: body,
				block: block,
				container: container,
				kind: container.classList.contains("x_opinionDissent") ? "dissent" : "concurrence"
			});
		}
	}
	return opinions;
}

function wlOpinionContainer(body, block) {
	let lead = body.closest(".x_opinionLead");
	if (lead) return lead;
	return body.closest(".x_opinionBlockBody") || block;
}

function wlSanitizeNode(node, doc, pageIndex, options) {
	options = options || {};
	if (!node) return [];
	if (node.nodeType === Node.TEXT_NODE) return [doc.createTextNode(node.nodeValue)];
	if (node.nodeType !== Node.ELEMENT_NODE) return [];
	if (wlSkipElement(node)) return [];

	let tag = node.tagName;
	let cleanNode = null;
	if (tag === "SPAN" && node.classList.contains("co_starPage")) {
		let pageText = wlPageNumberText(node, pageIndex);
		if (!pageText) return [];
		cleanNode = doc.createElement("span");
		cleanNode.className = "pageNumber";
		cleanNode.textContent = pageText;
		return [cleanNode];
	}
	if (tag === "SPAN" && node.classList.contains("co_hl") && !node.classList.contains("co_hlActivator")) {
		cleanNode = doc.createElement("span");
		let color = wlHighlightColor(node);
		if (options.snapshot) {
			let annotationID = wlSnapshotAnnotationID(options);
			cleanNode.id = annotationID;
			cleanNode.setAttribute("data-juris-lit-annotation", wlSnapshotAnnotationData(node, annotationID, color, options.annotationIndex.value));
		}
		else {
			cleanNode.setAttribute("style", "background-color: " + color);
		}
	}
	else if (tag === "DIV" && node.className.includes("co_paragraphText")) {
		cleanNode = doc.createElement("p");
		let indentStyle = options.snapshot ? wlCodeParagraphStyle(node) : wlIndentStyle(node);
		if (indentStyle) cleanNode.setAttribute("style", indentStyle);
	}
	else if (tag === "DIV" && node.className.includes("co_headtext")) {
		cleanNode = doc.createElement("h4");
	}
	else if (tag === "EM" || tag === "I") {
		cleanNode = doc.createElement("em");
	}
	else if (tag === "STRONG" || tag === "B") {
		if (!options.stripStrong) cleanNode = doc.createElement("strong");
	}
	else if (tag === "SUP") {
		cleanNode = doc.createElement("sup");
		cleanNode.textContent = wlClean(node.textContent);
		return cleanNode.textContent ? [cleanNode] : [];
	}
	else if (tag === "BLOCKQUOTE") {
		cleanNode = doc.createElement("blockquote");
	}
	else if (tag === "UL" || tag === "OL" || tag === "LI") {
		cleanNode = doc.createElement(tag.toLowerCase());
	}
	else if (tag === "BR") {
		return [doc.createElement("br")];
	}

	let children = [];
	for (let child of node.childNodes) children.push(...wlSanitizeNode(child, doc, pageIndex, options));
	if (!cleanNode) return children;
	if (tag === "DIV" && node.className.includes("co_paragraphText") && children.some(wlIsBlockquoteElement)) {
		let indentStyle = options.snapshot ? wlCodeParagraphStyle(node) : wlIndentStyle(node);
		return wlSplitParagraphAroundBlockquotes(doc, children, indentStyle);
	}
	cleanNode.append(...children);
	return wlClean(cleanNode.textContent) || cleanNode.querySelector(".pageNumber") ? [cleanNode] : [];
}

function wlSplitParagraphAroundBlockquotes(doc, children, indentStyle) {
	let nodes = [];
	let paragraph = wlNewParagraph(doc, indentStyle);
	for (let child of children) {
		if (wlIsBlockquoteElement(child)) {
			wlPushNonemptyNode(nodes, paragraph);
			nodes.push(child);
			paragraph = wlNewParagraph(doc, indentStyle);
		}
		else {
			paragraph.appendChild(child);
		}
	}
	wlPushNonemptyNode(nodes, paragraph);
	return nodes;
}

function wlNewParagraph(doc, indentStyle) {
	let paragraph = doc.createElement("p");
	if (indentStyle) paragraph.setAttribute("style", indentStyle);
	return paragraph;
}

function wlPushNonemptyNode(nodes, node) {
	if (wlClean(node.textContent) || node.querySelector(".pageNumber")) nodes.push(node);
}

function wlIsBlockquoteElement(node) {
	return node && node.nodeType === Node.ELEMENT_NODE && node.tagName === "BLOCKQUOTE";
}

function wlIndentStyle(node, structuralLevel) {
	let cls = wlClassTrail(node);
	let indent = cls.match(/\bco_indentLeft([0-9]+)\b/);
	let hanging = cls.match(/\bco_indentHanging([0-9]+)\b/);
	let plainIndent = /\bco_indentLeft\b/.test(cls);
	let explicitLevel = indent ? parseInt(indent[1]) : plainIndent ? 1 : 0;
	if (!explicitLevel && hanging) explicitLevel = parseInt(hanging[1]);
	let level = Math.max(explicitLevel, structuralLevel || 0);
	if (!level) return "";
	return "padding-left: " + (level * 20) + "px;";
}

function wlClassTrail(node) {
	let classes = [];
	let current = node;
	for (let i = 0; current && i < 3; i++) {
		if (current.className) classes.push(current.className);
		current = current.parentElement;
	}
	return classes.join(" ");
}

function wlEnsureLeadingPageNumber(nodes, pageNumber, doc) {
	if (!pageNumber || !nodes.length) return;
	let firstBlock = wlFirstPageNumberBlock(nodes);
	if (!firstBlock || wlStartsWithPageNumber(firstBlock)) return;
	let page = doc.createElement("span");
	page.className = "pageNumber prefixPageNumber";
	page.textContent = pageNumber;
	firstBlock.insertBefore(page, firstBlock.firstChild);
}

function wlFirstPageNumberBlock(nodes) {
	for (let node of nodes) {
		if (node.nodeType !== Node.ELEMENT_NODE) continue;
		if (node.tagName === "P") return node;
		if (node.tagName === "BLOCKQUOTE") return node.querySelector("p") || node;
	}
	return null;
}

function wlStartsWithPageNumber(node) {
	for (let child of Array.from(node.childNodes)) {
		if (child.nodeType === Node.TEXT_NODE && !wlClean(child.nodeValue)) continue;
		return child.nodeType === Node.ELEMENT_NODE && child.classList.contains("pageNumber");
	}
	return false;
}

function wlPageMarkerIndex(doc, root, selectedCitation) {
	let series = wlPageSeriesMap(doc);
	let selectedPageset = wlSelectedPageset(series, selectedCitation);
	let markers = Array.from(root.querySelectorAll(".co_starPage")).map(node => wlPageMarker(node, series)).filter(Boolean);
	let pagesets = Array.from(new Set(markers.map(marker => marker.pageset).filter(Boolean)));
	return {
		markers: markers,
		selectedPageset: selectedPageset,
		singlePageset: pagesets.length === 1 ? pagesets[0] : "",
		series: series
	};
}

function wlPageSeriesMap(doc) {
	let input = doc.querySelector("#co_document_starPageMetadata");
	let metadata = wlParseJSON(input ? input.value || input.getAttribute("value") : "");
	return metadata && metadata.citations ? metadata.citations : {};
}

function wlSelectedPageset(series, selectedCitation) {
	let selectedKey = wlCitationKey(selectedCitation);
	if (!selectedKey) return "";
	for (let pageset in series) {
		if (wlCitationKey(series[pageset]) === selectedKey) return pageset;
	}
	return "";
}

function wlPageMarker(node, series) {
	let metadata = wlStarPageMetadata(node);
	let pageset = metadata.pageset || "";
	let raw = wlClean(node.textContent);
	let pageNumber = metadata.pageNumber || raw.replace(/^\*+/, "");
	if (!raw && !pageNumber) return false;
	return {
		node: node,
		pageset: pageset,
		citation: series[pageset] || "",
		pageNumber: pageNumber,
		text: raw || pageNumber
	};
}

function wlStarPageMetadata(node) {
	let input = node.querySelector(".co_starPageMetadataItem");
	return wlParseJSON(input ? input.value || input.getAttribute("value") : "");
}

function wlGoverningPageNumber(pageIndex, node) {
	if (!pageIndex) return "";
	let markers = wlMarkersForPrefix(pageIndex);
	let governing = "";
	for (let marker of markers) {
		if (wlNodePrecedes(marker.node, node)) governing = wlPageNumberText(marker.node, pageIndex);
		else break;
	}
	return governing;
}

function wlMarkersForPrefix(pageIndex) {
	if (pageIndex.selectedPageset) return pageIndex.markers.filter(marker => marker.pageset === pageIndex.selectedPageset || !marker.pageset);
	if (pageIndex.singlePageset) return pageIndex.markers;
	return [];
}

function wlMarkerForNode(pageIndex, node) {
	if (!pageIndex) return null;
	return pageIndex.markers.find(marker => marker.node === node) || wlPageMarker(node, pageIndex.series);
}

function wlNodePrecedes(first, second) {
	return !!(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

function wlPageNumberText(node, pageIndex) {
	let raw = wlClean(node.textContent);
	if (!pageIndex) return raw ? "[" + raw + "] " : "";
	let marker = wlMarkerForNode(pageIndex, node);
	if (!marker) return raw ? "[" + raw + "] " : "";
	if (pageIndex.selectedPageset && marker.pageset && marker.pageset !== pageIndex.selectedPageset) return "";
	if (!pageIndex.selectedPageset && !pageIndex.singlePageset) return raw ? "[" + raw + "] " : "";
	return "[" + marker.text + "] ";
}

function wlCitationKey(citation) {
	return wlClean(citation).replace(/\s+/g, "").replace(/\./g, "")
.toLowerCase();
}

function wlSanitizeFootnote(footnote, doc, pageIndex, options) {
	let node = doc.createElement("div");
	node.className = "footnote";
	let markers = [];
	let pageText = wlFootnotePageNumber(footnote, pageIndex);
	if (pageText) {
		let page = doc.createElement("span");
		page.className = "pageNumber";
		page.textContent = pageText;
		markers.push(page);
	}
	let num = wlFootnoteNumber(footnote);
	let label = doc.createElement("span");
	label.className = "footnoteNumber";
	label.textContent = num ? "[n." + num + "] " : "[n.] ";
	markers.push(label);
	let body = footnote.querySelector(".co_footnoteBody") || footnote;
	let bodyNodes = wlSanitizeNode(body, doc, pageIndex, options);
	let inserted = wlInsertFootnoteMarkers(bodyNodes, markers);
	if (!(options && options.snapshot)) wlSuperscriptFootnoteNodes(doc, bodyNodes);
	if (!inserted) {
		let marker = doc.createElement("sup");
		marker.append(...markers);
		node.appendChild(marker);
	}
	node.append(...bodyNodes);
	return node;
}

function wlSuperscriptFootnoteNodes(doc, nodes) {
	for (let node of nodes) {
		if (node.nodeType !== Node.ELEMENT_NODE) continue;
		if (node.tagName === "P") {
			wlSuperscriptContents(doc, node);
		}
		else if (node.tagName === "BLOCKQUOTE") {
			let paragraphs = Array.from(node.querySelectorAll("p"));
			if (paragraphs.length) {
				for (let paragraph of paragraphs) wlSuperscriptContents(doc, paragraph);
			}
			else {
				wlSuperscriptContents(doc, node);
			}
		}
		else {
			wlSuperscriptContents(doc, node);
		}
	}
}

function wlSuperscriptContents(doc, node) {
	if (node.childNodes.length === 1 && node.firstChild.nodeType === Node.ELEMENT_NODE && node.firstChild.tagName === "SUP") return;
	let sup = doc.createElement("sup");
	while (node.firstChild) sup.appendChild(node.firstChild);
	node.appendChild(sup);
}

function wlInsertFootnoteMarkers(nodes, markers) {
	let target = wlFirstFootnoteTextBlock(nodes);
	if (!target) return false;
	for (let i = markers.length - 1; i >= 0; i--) {
		target.insertBefore(markers[i], target.firstChild);
	}
	return true;
}

function wlFirstFootnoteTextBlock(nodes) {
	for (let node of nodes) {
		if (node.nodeType !== Node.ELEMENT_NODE) continue;
		if (node.tagName === "P") return node;
		if (node.tagName === "BLOCKQUOTE") return node.querySelector("p") || node;
	}
	return null;
}

function wlFootnotesForNode(node, doc) {
	let footnotes = [];
	for (let ref of Array.from(node.querySelectorAll(".co_footnoteReference"))) {
		let targetId = wlFootnoteRefTargetId(ref);
		let target = targetId ? doc.getElementById(targetId) : null;
		let footnote = target ? wlFootnoteContainer(target) : null;
		if (!footnote) footnote = wlFootnoteByReference(doc, ref);
		if (!footnote) footnote = wlFootnoteByNumber(doc, wlFootnoteReferenceNumber(ref));
		if (footnote && !footnotes.includes(footnote)) footnotes.push(footnote);
	}
	return footnotes;
}

function wlParagraphForFootnote(footnote, doc) {
	let targetId = wlFootnoteTargetId(footnote);
	let returnIds = wlFootnoteReturnReferenceIds(footnote);
	let number = wlFootnoteNumber(footnote);
	for (let ref of Array.from(doc.querySelectorAll(".co_footnoteReference"))) {
		let refTargetId = wlFootnoteRefTargetId(ref);
		if ((targetId && refTargetId === targetId) || wlReferenceIdsForNode(ref).some(id => returnIds.includes(id)) || (number && wlFootnoteReferenceNumber(ref) === wlNormalizeFootnoteNumber(number))) {
			return ref.closest(".co_paragraphText");
		}
	}
	return false;
}

function wlFootnoteContainer(node) {
	if (!node || !node.closest) return null;

	let body = node.classList && node.classList.contains("co_footnoteBody") ? node : node.closest(".co_footnoteBody");
	if (body && body.parentElement) {
		let parent = body.parentElement;
		if (parent.querySelectorAll(".co_footnoteBody").length === 1) return parent;
	}

	let number = node.classList && node.classList.contains("co_footnoteNumber") ? node : node.closest(".co_footnoteNumber");
	if (number && number.parentElement) {
		let parent = number.parentElement;
		if (parent.querySelectorAll(".co_footnoteBody").length === 1) return parent;
	}

	let current = node;
	while (current && current.parentElement) {
		if (current.querySelectorAll && current.querySelectorAll(".co_footnoteBody").length === 1) return current;
		current = current.parentElement;
	}
	return null;
}

function wlFootnoteRefTargetId(ref) {
	let targetId = ref.getAttribute("data-footnote-target")
		|| ref.getAttribute("aria-controls")
		|| ref.getAttribute("aria-describedby")
		|| (ref.getAttribute("href") || "").replace(/^#/, "");
	return targetId ? targetId.replace(/^#/, "") : "";
}

function wlFootnoteTargetId(footnote) {
	let target = footnote.querySelector("span[id^='co_footnote']");
	return target ? target.id : "";
}

function wlFootnoteByReference(doc, ref) {
	let refIds = wlReferenceIdsForNode(ref);
	if (!refIds.length) return null;
	for (let link of Array.from(doc.querySelectorAll("span[id^='co_footnote'] a[href]"))) {
		let href = (link.getAttribute("href") || "").replace(/^#/, "");
		if (!href || !refIds.includes(href)) continue;
		return wlFootnoteContainer(link);
	}
	return null;
}

function wlFootnoteReturnReferenceIds(footnote) {
	return Array.from(footnote.querySelectorAll("span[id^='co_footnote'] a[href]"))
		.map(link => (link.getAttribute("href") || "").replace(/^#/, ""))
		.filter(Boolean);
}

function wlReferenceIdsForNode(ref) {
	let ids = [];
	let current = ref;
	while (current && current.nodeType === Node.ELEMENT_NODE) {
		if (current.id) ids.push(current.id);
		if (current.tagName === "SUP") break;
		current = current.parentElement;
	}
	return ids;
}

function wlFootnoteNumber(footnote) {
	return wlText(footnote.querySelector(".co_footnoteNumber span[id^='co_footnote'] a"))
		|| wlText(footnote.querySelector(".co_footnoteNumber span[id^='co_footnote']"))
		|| wlText(footnote.querySelector("span[id^='co_footnote'] a"))
		|| wlText(footnote.querySelector("span[id^='co_footnote']"))
		|| wlClean(wlText(footnote.querySelector(".co_footnoteNumber")).replace(/\*+\d+/g, ""));
}

function wlFootnotePageNumber(footnote, pageIndex) {
	let page = footnote.querySelector(".co_footnoteNumber .co_starPage");
	return page ? wlPageNumberText(page, pageIndex) : "";
}

function wlFootnoteReferenceNumber(ref) {
	return wlNormalizeFootnoteNumber(ref.textContent || ref.getAttribute("aria-label") || "");
}

function wlFootnoteByNumber(doc, number) {
	if (!number) return null;
	for (let body of Array.from(doc.querySelectorAll(".co_footnoteBody"))) {
		let footnote = wlFootnoteContainer(body);
		if (footnote && wlNormalizeFootnoteNumber(wlFootnoteNumber(footnote)) === number) return footnote;
	}
	return null;
}

function wlNormalizeFootnoteNumber(number) {
	let match = wlClean(number).match(/[A-Za-z0-9]+/);
	return match ? match[0] : "";
}

function wlSnapshotAnnotationID(options) {
	if (!options.annotationIndex) options.annotationIndex = { value: 0 };
	options.annotationIndex.value++;
	return "wl-annotation-" + options.annotationIndex.value;
}

function wlSnapshotAnnotationData(node, annotationID, color, index) {
	let annotation = {
		type: "highlight",
		text: wlClean(node.textContent),
		color: wlZoteroAnnotationColor(color),
		isExternal: false,
		sortIndex: String(index).padStart(7, "0"),
		position: {
			type: "CssSelector",
			value: "#" + annotationID
		}
	};
	return encodeURIComponent(JSON.stringify(annotation));
}

function wlZoteroAnnotationColor(color) {
	let normalized = wlClean(color).toLowerCase();
	let colorMap = {
		"#ffd400": "#ffd400",
		"#5fb236": "#5fb236",
		"#2ea8e5": "#2ea8e5",
		"#f19837": "#f19837",
		"#ff6666": "#ff6666",
		"#e56eee": "#e56eee",
		"#a28ae5": "#a28ae5",
		"#aaaaaa": "#aaaaaa",
		"#ffff99": "#ffd400",
		"#fff59d": "#ffd400",
		"#ccffcc": "#5fb236",
		"#ccffff": "#2ea8e5",
		"#ffcc99": "#f19837",
		"#ff6600": "#ff6666",
		yellow: "#ffd400",
		green: "#5fb236",
		blue: "#2ea8e5",
		orange: "#f19837",
		red: "#ff6666",
		pink: "#e56eee",
		purple: "#a28ae5",
		lavender: "#a28ae5",
		gray: "#aaaaaa",
		black: "#aaaaaa"
	};
	return colorMap[normalized] || "#ffd400";
}

function wlNodeAtOrAfter(boundary, node) {
	return boundary === node || boundary.contains(node) || wlNodePrecedes(boundary, node);
}

function wlParseCodeCitation(cite) {
	let result = { code: "", codeNumber: "", section: "", titlePrefix: "" };
	let clean = wlClean(cite).replace(/\u00a0/g, " ");
	let ruleNumber = "([0-9A-Za-z.:-]+(?:\\([^)]+\\))*)";
	let rulePatterns = [
		[new RegExp("^(?:FRCP|Fed\\.?\\s*R\\.?\\s*Civ\\.?\\s*P\\.?|Federal\\s+Rules?\\s+of\\s+Civil\\s+Procedure)(?:\\s+(?:Rule|R\\.?))?\\s+" + ruleNumber, "i"), "Fed. R. Civ. P."],
		[new RegExp("^NC\\s+ST\\s+RCP\\s+§?\\s*1A-1,\\s+Rule\\s+" + ruleNumber, "i"), "N.C.R. Civ. P."],
		[new RegExp("^NC\\s+ST\\s+EV\\s+§?\\s*8C-1,\\s+Rule\\s+" + ruleNumber, "i"), "N.C.R. Evid."],
		[new RegExp("^NC\\s+R\\s+SUPER\\s+AND\\s+DIST\\s+CTS\\s+Rule\\s+" + ruleNumber, "i"), "N.C. Gen. R. Prac."],
		[new RegExp("^NC\\s+R\\s+RAP\\s+App\\.?\\s+R\\.?\\s+" + ruleNumber, "i"), "N.C. R. App. P."]
	];
	for (let entry of rulePatterns) {
		let match = clean.match(entry[0]);
		if (!match) continue;
		result.code = entry[1];
		result.section = "r. " + match[1];
		return result;
	}
	let patterns = [
		[/^(\d+)\s+C\.F\.R\.\s+§?\s*([0-9A-Za-z.:\-–]+)/i, "C.F.R."],
		[/^(\d+)\s+NCAC\s+([0-9A-Za-z.:\-–]+)/i, "N.C. Admin. Code"],
		[/^(\d+)\s+NC\s+ADC\s+([0-9A-Za-z.:\-–]+)/i, "N.C. Admin. Code"],
		[/^(\d+)\s+N\.C\.\s+Admin\.?\s+Code\s+([0-9A-Za-z.:\-–]+)/i, "N.C. Admin. Code"],
		[/^(\d+)\s+U\.S\.C\.A?\.\s+§?\s*([0-9A-Za-z.:\-–]+)/i, "U.S.C."],
		[/^(\d+)\s+USCA\s+§?\s*([0-9A-Za-z.:\-–]+)/i, "U.S.C."],
		[/^N\.C\.G\.S\.A\.\s+§?\s*([0-9A-Za-z.:\-–]+)/i, "N.C.G.S."],
		[/^NC\s+ST\s+§?\s*([0-9A-Za-z.:\-–]+)/i, "N.C.G.S."]
	];
	for (let entry of patterns) {
		let match = clean.match(entry[0]);
		if (!match) continue;
		result.code = entry[1];
		if (match.length === 3) {
			result.codeNumber = match[1];
			result.section = match[2];
			result.titlePrefix = result.codeNumber + " " + result.code;
		}
		else {
			result.section = match[1];
			result.titlePrefix = result.code;
		}
		return result;
	}
	result.section = clean;
	return result;
}

function wlCodeItemTitle(title, parsed) {
	title = wlClean(title);
	if (!parsed.titlePrefix) return title;
	if (parsed.code === "N.C. Admin. Code" && parsed.section && /^\./.test(title)) {
		return parsed.titlePrefix + " " + parsed.section + " " + title.replace(/^\.[0-9A-Za-z.:\-–]+\s*/i, "");
	}
	return parsed.titlePrefix + " " + title;
}

function wlCodeEffectiveDate(doc, metadata) {
	return wlClean(
		wlText(doc.querySelector("#effectiveDate"))
		|| wlText(doc.querySelector(".co_effectiveDate"))
		|| metadata.effectiveDate
		|| metadata.date
		|| metadata.publicationDate
	).replace(/^Effective:\s*/i, "");
}

function wlCodeJurisdiction(parsed, metadata) {
	if (parsed.code === "U.S.C." || parsed.code === "C.F.R." || parsed.code === "Fed. R. Civ. P.") return "us";
	if (parsed.code === "N.C.G.S."
		|| parsed.code === "N.C. Admin. Code"
		|| /^N\.C\./.test(parsed.code)) {
		return "us:nc";
	}
	let text = metadata.jurisdictionText || metadata.jurisdiction || "";
	let stateMatch = wlClean(text).match(staterex);
	return stateMatch ? stateMap[stateMatch[1]] : undefined;
}

function wlParseRestatementCitation(cite) {
	let clean = wlClean(cite);
	let match = clean.match(/^(.*?)\s+§+\s*([A-Za-z0-9.:-]+)(?:\s+\(([^)]*)\))?/);
	if (match) return { code: match[1], section: match[2], year: wlYearFromText(match[3]) };
	return { code: clean, section: "", year: "" };
}

function wlParseTreatiseCitation(cite, title) {
	let clean = wlClean(cite);
	let result = {
		volume: "",
		section: wlSectionFromText(clean) || wlSectionFromText(title),
		edition: "",
		date: wlNormalizeSecondaryDate(clean)
	};
	let sectionMatch = clean.match(/§+\s*[A-Za-z0-9.:-]+/);
	let beforeSection = sectionMatch ? clean.slice(0, sectionMatch.index).trim() : clean;
	let volumeMatch = beforeSection.match(/^([0-9]+[A-Za-z]?(?:-[0-9A-Za-z]+)?)\s+/);
	if (volumeMatch) result.volume = volumeMatch[1];
	let editionMatch = clean.match(/\(([^)]*(?:ed\.|supp\.|rev\.)[^)]*)\)/i);
	if (editionMatch) result.edition = wlClean(editionMatch[1]);
	if (!wlLooksLikeDate(result.date)) result.date = "";
	return result;
}

function wlParseDictionaryCitation(cite) {
	let clean = wlClean(cite);
	let result = { title: clean, edition: "", year: "" };
	let match = clean.match(/^(.*?)\s+\(([^)]*?)(?:\s+(\d{4}))?\)$/);
	if (!match) return result;
	result.title = wlClean(match[1]);
	let parenthetical = wlClean(match[2]);
	result.year = match[3] || wlYearFromText(parenthetical);
	result.edition = wlClean(parenthetical.replace(/\b\d{4}\b/g, ""));
	return result;
}

function wlSectionFromText(text) {
	let match = wlClean(text).match(/(?:§+|Sections?|Secs?\.)\s*([A-Za-z0-9][A-Za-z0-9.:-]*)/i);
	return match ? match[1] : "";
}

function wlSectionTitle(title, section) {
	title = wlClean(title);
	if (!title) return section ? "§ " + section : "";
	if (/^§+\s*/.test(title) || !section) return title;
	return "§ " + section + " " + title;
}

function wlRestatementBookTitle(doc, fallback) {
	let candidates = Array.from(doc.querySelectorAll(".co_propBlock .co_headtext, #pubname"))
		.map(wlText)
		.filter(text => text && /Restatement|Am\.\s*Jur\.|C\.J\.S\.|Corpus Juris/i.test(text))
		.filter(text => !/^§+\s*/.test(text));
	let fallbackTitle = wlRestatementTitleFromCitation(fallback);
	if (fallbackTitle) candidates.push(fallbackTitle);
	if (!candidates.length) return wlClean(fallback);
	candidates.sort((a, b) => wlRestatementBookTitleScore(b) - wlRestatementBookTitleScore(a) || b.length - a.length);
	return candidates[0];
}

function wlRestatementTitleFromCitation(cite) {
	let clean = wlClean(cite);
	let match = clean.match(/^(.*?)\s+§+\s*[A-Za-z0-9.:-]+(?:\s+\([^)]*\))?/);
	return match ? wlClean(match[1]) : "";
}

function wlRestatementBookTitleScore(title) {
	let score = 0;
	if (/Restatement\s+\([^)]+\)/i.test(title)) score += 10;
	if (/Restatement\s+of\s+the\s+Law/i.test(title)) score -= 5;
	if (/\b(?:Chapter|Topic|Part|Title)\b/i.test(title)) score -= 3;
	return score;
}

function wlNormalizeSecondaryDate(date) {
	return wlClean(date)
		.replace(/^(?:Section\s+)?(?:last\s+)?updated\s+/i, "")
		.replace(/^current\s+(?:through|with)\s+/i, "")
		.replace(/^updated\s+through\s+/i, "");
}

function wlLooksLikeDate(text) {
	return /\b(?:Jan\.?|January|Feb\.?|February|Mar\.?|March|Apr\.?|April|May|June|Jun\.?|July|Jul\.?|Aug\.?|August|Sept\.?|September|Oct\.?|October|Nov\.?|November|Dec\.?|December)\b/i.test(text)
		|| /\b(1[5-9]\d{2}|20\d{2})\b/.test(text);
}

function wlTreatiseBookTitle(doc, metadata) {
	return wlText(doc.querySelector(".co_publicationLine .co_headtext"))
		|| wlText(doc.querySelector("#pubname"))
		|| wlFirstHeadtext(doc)
		|| metadata.functionalCite
		|| "";
}

function wlTreatiseBookTitleFromCitation(cite) {
	let clean = wlClean(cite);
	let sectionMatch = clean.match(/\s+§+\s*[A-Za-z0-9.:-]+/);
	return sectionMatch ? clean.slice(0, sectionMatch.index).trim() : "";
}

function wlShouldPreferTreatiseCitationTitle(bookTitle, citationTitle) {
	if (!citationTitle) return false;
	return /^(?:American Jurisprudence, Second Edition|Corpus Juris Secundum)$/i.test(wlClean(bookTitle));
}

function wlCommentaryBookTitle(title, volume) {
	title = wlClean(title);
	volume = wlClean(volume);
	if (!title || !volume) return title;
	return wlClean(title.replace(new RegExp("^" + wlEscapeRegExp(volume) + "\\s+"), ""));
}

function wlTreatiseDate(doc, metadata) {
	return wlNormalizeSecondaryDate(
		wlText(doc.querySelector(".co_publicationLine .co_date"))
		|| metadata.date
		|| metadata.publicationDate
		|| wlText(doc.querySelector(".co_date"))
	);
}

function wlRestatementRuleRoot(section, boundary) {
	for (let block of Array.from(section.querySelectorAll(".co_researchReferenceBlock"))) {
		if (boundary && wlNodeAtOrAfter(boundary, block)) continue;
		if (/Primary Authority|Forms|Secondary Sources/i.test(wlText(block.querySelector(".co_headtext")))) continue;
		return block;
	}
	return null;
}

function wlRestatementRuleParagraphs(rule, boundary) {
	return Array.from(rule.querySelectorAll(".co_paragraphText"))
		.filter(paragraph => !boundary || !wlNodeAtOrAfter(boundary, paragraph));
}

function wlRestatementCommentNode(section) {
	let candidates = Array.from(section.querySelectorAll("[id*='co_anchor_comment'], .co_headtext, h2, h3"))
		.filter((node) => {
			let id = node.id || "";
			let text = wlText(node);
			return /co_anchor_comment/i.test(id) || /^Comments?:?\s*$/i.test(text);
		});
	return wlFirstNodeInDocumentOrder(candidates);
}

function wlRestatementBoundaryNode(section) {
	let candidates = Array.from(section.querySelectorAll("[id*='co_anchor_repnote'], [id*='co_anchor_casenote'], .co_headtext, h2, h3"))
		.filter((node) => {
			let id = node.id || "";
			let text = wlText(node);
			return /co_anchor_(?:repnotes?|casenote)/i.test(id)
				|| /^(?:Reporters?'?\s+Notes?|Case Citations|General Case Citations)\b/i.test(text);
		});
	return wlFirstNodeInDocumentOrder(candidates);
}

function wlRestatementCaseCitationsNode(section) {
	let candidates = Array.from(section.querySelectorAll("[id*='co_anchor_casenote'], .co_headtext, h2, h3"))
		.filter((node) => {
			let id = node.id || "";
			let text = wlText(node);
			return /co_anchor_casenote/i.test(id)
				|| /^Case Citations\b/i.test(text)
				|| /^General Case Citations\b/i.test(text);
		});
	return wlFirstNodeInDocumentOrder(candidates);
}

function wlFirstNodeInDocumentOrder(nodes) {
	if (!nodes.length) return null;
	nodes.sort((a, b) => {
		if (a === b) return 0;
		return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
	});
	return nodes[0];
}

function wlIsRestatementExcludedNode(node) {
	if (wlIsRestatementCitationBlock(node)) return true;
	let current = node;
	while (current && current.nodeType === Node.ELEMENT_NODE) {
		if (wlIsRestatementCitationBlock(current)) return true;
		current = current.parentElement;
	}
	return false;
}

function wlParseFederalRegisterCitation(cite) {
	let clean = wlClean(cite);
	let match = clean.match(/^(\d+)\s+FR\s+([0-9-]+)(?:,?\s+(\d{4})\s+WL\s+([0-9]+)(?:\(([^)]*)\))?)?/i);
	return match
		? {
			volume: match[1] || "",
			pages: match[2] || "",
			wlYear: match[3] || "",
			wlNumber: match[4] || "",
			wlReporter: match[5] || ""
		}
		: {};
}

function wlFederalRegisterDate(doc, metadata) {
	let datePattern = /\b(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+)?[A-Z][a-z]+\s+\d{1,2},\s+\d{4}\b/;
	for (let node of Array.from(doc.querySelectorAll(".co_documentHead .co_center, #co_docHeaderCitation #date"))) {
		let text = wlText(node);
		let dateMatch = text.match(datePattern);
		if (dateMatch) return dateMatch[0];
	}
	return metadata.date || metadata.publicationDate || "";
}

function wlFederalRegisterAgency(doc) {
	let headings = Array.from(doc.querySelectorAll(".co_documentHead .co_center .co_headtext")).map(wlText);
	return headings.find(text => /\b(?:Department|Administration|Agency|Commission|Board|Bureau|Office|Service)\b/i.test(text) && !/^RIN\b/i.test(text)) || "";
}

function wlFederalRegisterExtra(doc) {
	let lines = [];
	let action = wlFederalRegisterLabeledParagraph(doc, "ACTION");
	let summary = wlFederalRegisterLabeledParagraph(doc, "SUMMARY");
	let dates = wlFederalRegisterLabeledParagraph(doc, "DATES");
	if (action) lines.push("Action: " + action);
	if (dates) lines.push("Dates: " + dates);
	if (summary) lines.push("Summary: " + summary);
	return lines.join("\n");
}

function wlFederalRegisterLabeledParagraph(doc, label) {
	let pattern = new RegExp("^" + label + ":\\s*(.*)", "i");
	for (let paragraph of Array.from(doc.querySelectorAll(".co_paragraphText"))) {
		let match = wlText(paragraph).match(pattern);
		if (match) return match[1];
	}
	return "";
}

function wlYearFromText(text) {
	let match = wlClean(text).match(/\b(1[5-9]\d{2}|20\d{2})\b/);
	return match ? match[1] : "";
}

function wlGetDocumentRoot(doc) {
	return doc.querySelector("#co_document_0") || doc.querySelector("#co_document .co_document") || doc.querySelector(".co_document");
}

function wlGetSectionRoot(doc) {
	return doc.querySelector(".co_contentBlock.co_briefItState.co_section") || wlGetDocumentRoot(doc);
}

function wlGetCodeBody(doc) {
	return doc.querySelector(".co_contentBlock.co_briefItState.co_body") || wlGetSectionRoot(doc);
}

function wlGetTitle(doc, metadata) {
	return wlClean(metadata.titleText || metadata.TitleText || wlText(doc.querySelector("#co_docHeaderTitleLine")) || wlText(doc.querySelector(".co_title")) || (doc.title || "").split("|")[0]);
}

function wlGetCite(doc, metadata) {
	return wlClean(metadata.functionalCite || metadata.FunctionalCite || metadata.cite || metadata.Cite || wlText(doc.querySelector(".co_cites")) || wlText(doc.querySelector("#co_docHeaderCitation #cite, #co_docHeaderCitation [id^='cite']")));
}

function wlGetCourtLine(doc, metadata) {
	return wlClean(wlText(doc.querySelector(".co_courtBlock")) || metadata.courtYear || metadata.court || metadata.Court || "");
}

function wlFirstHeadtext(doc) {
	return wlText(doc.querySelector(".co_headtext"));
}

function wlLooksLikePersonalCreator(name) {
	name = wlClean(name);
	if (!name) return false;
	if (/\b(Code|Rules?|Procedure|Practice|Restatement|Treatise|Guide|Manual|Handbook|Law|Regulations?)\b/i.test(name)) return false;
	if (/\b(Inc\.?|LLC|L\.L\.C\.|Association|Institute|Committee|Board|Department|Division|Office|University|College|Court)\b/i.test(name)) return false;
	return /^[A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+|\s+[A-Z]\.){1,4}$/.test(name);
}

function wlAddCreator(item, name) {
	name = wlClean(name);
	if (!name) return;
	let parts = name.split(/\s+/);
	let lastName = parts.pop();
	item.creators = item.creators || [];
	item.creators.push({ firstName: parts.join(" "), lastName: lastName, creatorType: "author" });
}

function wlArticlePages(cite) {
	let match = wlClean(cite).match(/\s(\d+)(?:$|,)/);
	return match ? match[1] : undefined;
}

function wlParseJSON(raw) {
	if (!raw) return {};
	let attempts = [raw, raw.replace(/&quot;/g, '"'), raw.replace(/\\"/g, '"')];
	for (let attempt of attempts) {
		try {
			return JSON.parse(attempt);
		}
		catch (e) {}
	}
	return {};
}

function wlText(node) {
	return node ? wlClean(node.innerText || node.textContent || "") : "";
}

function wlClean(text) {
	return (text || "").replace(/\u200b/g, "").replace(/\s+/g, " ").trim();
}

function wlEscape(text) {
	return wlClean(text).replace(/&/g, "&amp;").replace(/</g, "&lt;")
.replace(/>/g, "&gt;");
}

function wlEscapeRegExp(text) {
	return wlClean(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wlHighlightColor(node) {
	let match = node.className.match(/\b(yellow|green|blue|pink|orange|red|purple|gray|black)\b/);
	let color = match ? match[1] : "yellow";
	return stockHighlightColors[color] || stockHighlightColors.yellow;
}

function wlHasMeaningfulHighlight(node) {
	return Array.from(node.querySelectorAll(".co_hl:not(.co_hlActivator)")).some(e => wlClean(e.textContent));
}

function wlSkipElement(node) {
	let cls = node.className || "";
	return node.tagName === "SCRIPT"
		|| node.tagName === "STYLE"
		|| node.tagName === "INPUT"
		|| (node.tagName === "BUTTON" && !cls.includes("co_footnoteReference"))
		|| cls.includes("co_hlStart")
		|| cls.includes("co_hlEnd")
		|| cls.includes("co_hlActivator")
		|| cls.includes("co_inlineKeyCiteFlag")
		|| cls.includes("co_excludeAnnotations")
		|| cls.includes("co_disableHighlightFeatures")
		|| cls.includes("Athens-headnotes")
		|| cls.includes("co_headnoteLink")
		|| cls.includes("co_keyIcon");
}

function wlIsInsideExcludedBlock(node) {
	return !!(node.closest && node.closest("#co_headnotes, .co_headnotes, .co_synopsis, .co_attorneyBlock, .LegalSimilarity-document-caption"));
}

function wlIsInsideFootnote(node) {
	return !!(node.closest && node.closest(".co_footnoteBody"));
}

function wlShouldStopAtCitationBlock(node) {
	return !!(node.id && (node.id.includes("co_anchor_repnote") || node.id.includes("co_anchor_casenote")));
}

function wlIsRestatementCitationBlock(node) {
	if (wlShouldStopAtCitationBlock(node)) return true;
	let cls = node.className || "";
	let isHeading = cls.includes("co_headtext") || /H[1-6]/.test(node.tagName || "");
	return isHeading && /Case Citations|Reporters?'? Note/i.test(wlText(node));
}

function wlIsRestatementLike(cite, title, subContentType) {
	return /Restatement/i.test(cite + " " + title + " " + subContentType);
}

function wlIsDictionaryLike(cite, title, subContentType) {
	return /Black'?s?\s+Law\s+Dictionary/i.test(cite + " " + title + " " + subContentType)
		|| /\bDictionary\b/i.test(subContentType);
}

function wlIsUnpublished(doc) {
	let caveat = wlText(doc.querySelector(".co_caveatBlock")).toLowerCase();
	return caveat.includes("unpublished");
}

function wlHasNegativeHistory(doc) {
	let flagNodes = doc.querySelectorAll(".co_inlineKeyCiteFlag, .co_keyIcon, [alt], [title], [aria-label]");
	return Array.from(flagNodes).some((node) => {
		let text = [
			node.className,
			node.getAttribute("alt"),
			node.getAttribute("title"),
			node.getAttribute("aria-label"),
			node.getAttribute("src"),
			wlText(node)
		].filter(Boolean).join(" ").toLowerCase();
		return /\bred\s*flag\b/.test(text)
			|| /\bnegative (history|treatment)\b/.test(text)
			|| /\bsevere negative\b/.test(text);
	});
}

function wlOpinionLabel(opinionData, index) {
	let kind = wlOpinionKind(opinionData, index);
	if (kind === "concurrence-dissent") return "Concurring in Part / Dissenting in Part";
	if (kind === "concurrence") return "Concurrence";
	if (kind === "dissent") return "Dissent";
	if (kind === "separate") return "Separate Opinion";
	return "Majority Opinion";
}

function wlOpinionKind(opinionData, index) {
	if (opinionData.kind === "majority") {
		return index === 0 ? "majority" : "separate";
	}
	if (opinionData.kind === "concurrence" || opinionData.kind === "dissent") {
		return opinionData.kind;
	}

	let labelText = [
		opinionData.kind,
		opinionData.container ? opinionData.container.className : "",
		wlOpinionAuthor(opinionData.container),
		wlNearestCipDipHeading(opinionData.container)
	].join(" ");
	if (/\bconcurr(?:ence|ing)?\b/i.test(labelText) && /\bdissent(?:ing)?\b/i.test(labelText)) {
		return "concurrence-dissent";
	}
	if (/\bconcurr(?:ence|ing)?\b/i.test(labelText)) return "concurrence";
	if (/\bdissent(?:ing)?\b/i.test(labelText)) return "dissent";
	return "separate";
}

function wlOpinionAuthor(block) {
	if (!block || !block.querySelector) return "";
	return wlText(block.querySelector(".x_leadAuthorLine, .co_cipdipAuthorLineBlock, .x_concurrenceAuthorLine, .x_dissentAuthorLine, .AuthorLine"));
}

function wlNearestCipDipHeading(node) {
	let current = node;
	while (current && current.previousElementSibling) {
		current = current.previousElementSibling;
		let heading = current.querySelector && current.querySelector(".CipDipHeading");
		if (heading) return wlText(heading);
	}
	return "";
}

function wlNoteHTML(wrapper) {
	return wlClean(wrapper.textContent) ? wrapper.innerHTML.replace(/\s{2,}/g, " ") : "";
}

/** BEGIN TEST CASES **/
var testCases = []
/** END TEST CASES **/
