{
	"translatorID": "fc9e5c87-2a77-450c-8a05-d48c58dbca69",
	"translatorType": 4,
	"label": "Westlaw",
	"creator": "David Hawisher",
	"target": "^.*westlaw.*",
	"minVersion": "3.0",
	"maxVersion": null,
	"priority": 10,
	"inRepository": true,
	"browserSupport": "gcsibv",
	"lastUpdated": "2020-08-20 08:23:10"
}


function detectWeb(doc, url) {
	// Icon shows only for cases, statutes, and regulations
	let head = ZU.xpathText(doc, '//title')
	if (!head)
		return
	if (head.indexOf('| Cases |') != -1) {
		return "case"
	}
	if (head.indexOf('| Statutes |') != -1) {
		return "statute"
	}
	if (head.indexOf('| Regulations |') != -1) {
		return "regulation"
	}
}
function getXPathStr(attr, elem, path) {
	let res = ZU.xpath(elem, path)
	res = res.length ? res[0][attr] : ''
	return res ? res : ''
}

function doWeb(doc, url) {
	var type = detectWeb(doc, url)
	var NewItem = new Zotero.Item(type)
	if (type == "case") {
		NewItem.caseName = ZU.xpathText(doc, '//h2[@id="co_docHeaderTitleLine"]')
		let citationArray = []
		for (let i = 0; i < 6; i++) {
			let cite = ZU.xpathText(doc, '//span[@id="cite' + i + '"]/text()')
			if (cite) {citationArray.push(cite)}
		} 
		NewItem.date = ZU.xpathText(doc, '//span[@id="filedate"]/text()')
		NewItem.filingDate = NewItem.date //Need this to make a shortened bluebook citation style work 
		let court = ZU.xpathText(doc, '//span[@id="courtline"]/text()').replace(/\.$/g, "")
		let note = getAnnotations(doc)
		if (note) NewItem.notes.push({'note': note})
		Object.assign(NewItem, parseCitations(citationArray))
		NewItem.shortTitle = shortTitle(NewItem.caseName)
		NewItem.jurisdiction = parseJurisdiction(court)
		NewItem.court = parseCourt(court)
		NewItem.url = westlawURL(NewItem)
		NewItem.complete()
	}
	if (type == "regulation" || type == "statute") {
		var cite = ZU.xpathText(doc, '//div[@class="co_cites"]/text()')
		var effectiveDate = ZU.xpathText(doc, '//span[@id="effectiveDate"]/text()')
		try {
			var code = cite.match(codeRex)[1]
			var codeNumPointer = codeRexMap[code][1]
			var sectionPointer = codeRexMap[code][2]
			if (codeNumPointer) {
				var codeNum = cite.match(codeRexMap[code][0])[codeNumPointer]
			}
			if (sectionPointer) {
				var section = cite.match(codeRexMap[code][0])[sectionPointer]
			}
			if (!section) {
				section = cite
			}
			if (!codeNum) {
				codeNum = []
			}
			let nSection = section
			if (section) {
				nSection = section.replace("-", "\\-")
			}
			if (abbrevMap[code]) {
				code = abbrevMap[code]
			}
			NewItem.title = document.getElementsByClassName('co_title')[0].innerText
			NewItem.codeNumber = codeNum
			NewItem.section = nSection
			NewItem.code = code
			NewItem.title = code ? code + " " + NewItem.title : NewItem.title
			NewItem.title = codeNum ? codeNum + " " + NewItem.title : NewItem.title
		} catch (err) {
			console.warn(err.message)
			NewItem.title = cite
		}
		let note = getStatuteText(doc, NewItem.title)
		if (note) NewItem.notes.push({'note': note})
		NewItem.publicationDate = effectiveDate
		let metadata = JSON.parse(document.getElementById('co_document').nextElementSibling.value.replace(/\\/g, ""))
		let guid = metadata['docGuid']
		NewItem.url = `westlaw.com/Document/${guid}/View/FullText.html?transitionType=Default&contextData=(sc.Default)&VR=3.0&RS=cblt1.0`
		NewItem.complete()
	}
}

function getStatuteText(doc, title) {
	let statute = document.getElementsByClassName("co_contentBlock co_briefItState co_body")[0]
	let sParagraphs = statute.getElementsByClassName("co_paragraphText")
	let note = title
	let indentMod = 0 //left indent is smaller than hanging indent at the same number
	for (p of sParagraphs) {
		console.log(p)
		let indent = 0
		//if (p.className.match(/(?:co_indentHanging)([1-9])/)) indent++
		try {
			indent+= p.className.match(/(?:co_indentLeft)([1-9])/)[1]
		} catch(err) {
			console.log(err.message)
		}

		indent = Math.min(indent, 5) * 20
		indent = indent ? ` style='padding-left: ${indent}px'` : ''
		note += `<p${indent}>${p.innerText}</p>` + '\n'
	}
	if (note.length > title.length) return note
}

//Get case highlighting and associated page numbers and use as note for Zotero item. This is really useful.
function getAnnotations(doc) {
	let highlights = Array.prototype.slice.call(doc.getElementsByClassName('co_hl'))
	if (highlights.length === 0) return
	let commentsArray = Array.prototype.slice.call(doc.getElementsByClassName('co_noteHolder'))
	let hTemp = []
	let comments = {}
	let i = -1
	let annotationRegex = /(?:co_noteHolder_|co_selection_)([0-9])+/
	
	highlights.forEach((item, index) => { //we want an array of objects, each representing an entire highlighted passage
		if (item.id) { //the first span of each highlight has an ID and the rest do not, so we use that to check whether the item is part of a previous highlight
			i++
			hTemp.push({})
			hTemp[i]['id'] = item.id.match(annotationRegex)[1] || id
			hTemp[i]['color'] = hTemp[i]['color'] || item.className.match(/(yellow|green|blue|pink|orange|purple|black)/)[0]
			hTemp[i]['page'] = getPageNumber(item, doc)
			hTemp[i]['text'] = ""
		}
		hTemp[i]['text'] = hTemp[i]['text'] + item.innerText + ""	
	})
	highlights = hTemp
	console.log(highlights)
	
	if (commentsArray.length > 0) { //now we want an object of the comments, since comments will be associated with highlights.
		commentsArray.forEach((item, index) => {
			comments[item.id.match(annotationRegex)[1]] = item.getElementsByClassName('co_viewNoteText')[0].innerText
		})
	}
	console.log(comments)
	
	let note = ''
	
	for (s of noteSections) {//TODO make this more resilient to improper colors in the future
		let sNote = '' 
		for (h of highlights) {
			if (s[1].indexOf(h.color) > -1) {
				if (comments[h.id]) {
					sNote += `<p>${comments[h.id]}:</p>` + "\n"
				}
				sNote += `<p><blockquote>${h.text} [${h.page}]</blockquote></p>` + "\n"
			}
		}
		if ((s[0] === "Other" | s[0] === "Reasoning") & note.length === 0) {
			note = sNote
		} else if (sNote.length > 0) {
			note += `<h4>${s[0]}</h4>` + "\n" + sNote
		}
	}

	return note
}
//Helper array for structuring output note. Category name (in preferred order), 
//followed by an array of color names, choosing from yellow, green, blue, pink, orange, purple, black.
const noteSections = [
	["Rule", ["green"]],
	["Reasoning", ["green", "yellow"]],
	["Facts", ["blue"]], //Have to do it this way to ensure that the holding goes with the reasoning in support of it
	["Concerning Language", ["pink"]],
	["Other", ["orange", "purple", "black"]] //Remaining colors. 
]

/* function getAnnotations(doc) {
	let annotations = Array.prototype.slice.call(doc.getElementsByClassName('co_hl'))
	let comments = Array.prototype.slice.call(doc.getElementsByClassName('co_noteContainer'))
	let arr = []
	let noteText = ''
	let page = ''
	let commentsObj = {} //put comment text in an object corresponding to the annotationid, which is how we will link each note's text to its comment
	if (comments.length > 0) {
		comments.forEach((item, index) => {
			console.log(item)
			commentsObj[item.getAttribute('data-annotationid')] = item.children[0].children[2].innerText
		})
	}
	console.log(commentsObj)
	if (annotations.length > 0) {
		annotations.forEach((item, index) => {
			let id = item.getAttribute('data-annotationid')
			let next = annotations[index + 1] || false
			let idNext = ''
			idNext = (next ? annotations[index + 1].getAttribute('data-annotationid') : '')
			noteText += item.innerText
			page = page || getPageNumber(item, doc)
			if (id !== idNext) {
				arr.push({ 'id': id, 'text': noteText.trim(), 'page': page })
				console.log(id)
				page = ''
				noteText = ''
			}
		})
	}
	if (arr.length > 0) {
		let note = ''
		for (b of arr) {
			if (commentsObj[b.id]) {
				note += `<p>${commentsObj[b.id]}</p>`
			}
			note += `<p><blockquote>${b.text} [${b.page}]</blockquote></p>`
		}
		return note
	}
} */

function getPageNumber(ele, doc) { //for now this is only used for annotations. We get the page number of each annotation by iterating through the page numbers in the document until we find one that occurs after the start of our annotation.
	let page = ""
	try { //Check if ele is in a footnote
		if (document.getElementById('co_footnoteSection').contains(ele)) {
			let i = 0
			while (ele.className !== 'co_footnoteBody' & i < 6) {
				ele = ele.parentNode
				i++
			}
			if (ele.className !== 'co_footnoteBody') return 'footnote'
			ele = ele.previousSibling
			if (ele.className !== 'co_footnoteNumber') return 'footnote'
			console.log(ele.innerText)
			page = "n." + ele.innerText
			console.log(ele.firstChild)
			try {
				let value = JSON.parse(ele.firstChild.value.replace(/\\/g, ""))
				console.log(value)
				console.log(value["pageNumber"])
				page = "*" + value["pageNumber"] + " " + page
				return page
			} catch(err) {
				console.warn(err.message)
				return "n." + ele.innerText
			}
		}
	} catch(err) {
		console.warn(err.message)
	}
	let pageNumbers = doc.getElementsByClassName('co_starPage')
	let comparison = 0
	for (pageNumber of pageNumbers) {
		if(pageNumber.innerText.indexOf('**') === -1) {
			comparison = pageNumber.compareDocumentPosition(ele)
			if (comparison === 4) {
				page = pageNumber.innerText
			} else {
				return page
			}
		}
	}
}

//Case Names
function shortTitle(caseName) {
	let vStart = caseName.indexOf(' v. ')
	if (vStart === -1) { return ''}
	let vEnd = vStart + 4
	let parties = []
	parties.push(caseName.slice(0, vStart))
	parties.push(caseName.slice(vEnd, caseName.length))
	if (parties[0].length - parties[1].length > 9) { parties.reverse() } // we want to save space, but there is a preference for using the first party's name unless it would save noticeable space to use the second party's. 
	if (!(govPattern.test(parties[0]))) {
		return shortParty(parties[0])
	} else if (!(govPattern.test(parties[1]))) {
		return shortParty(parties[1])
	} else {
		return
	}
}
function shortParty(p) {
	if (govPattern.test(p)) { return false }
	while (trimPattern.test(p)) { //we want to get rid of bloat like "co., LLP" from the end of party names.
		p = p.replace(trimPattern,"")
	}
	return p
}
 
//Case URLS
function westlawURL(item) { //some items (unpublished ones) will have Archive field info; others will have traditional volume/reporter info. This function works for both. It breaks if you have some of [reporter, volume, page] but not all.
	let reporter = item.reporter || item.archive
	let volume = item.volume || item.yearAsVolume
	let page = item.firstPage || item.archiveLocation
	return "https://1.next.westlaw.com/Search/Results.html?query=find:" + volume + "%20" + reporter + "%20" + page + "#autoLogin"
}



//Helper Scripts to Parse Westlaw Text
function parseJurisdiction(court) {
	court = court.replace(/, [a-zA-Z]* *Division\.*$/i, "")
	if (fedMap[court]) {
		return fedMap[court]
	} else if (court.match(staterex)) {
		let courtMatch = stateMap[court.match(staterex)[1]]
		return courtMatch
	}
}
function parseCourt(court) {
	if (court.indexOf("Supreme") != -1) { return 'supreme.court' }
	else if (court.indexOf("Appeals") != -1) {return "court.appeals"}
	else if (court.indexOf("Superior") != -1) {return "superior.court"}
	else if (court.indexOf("District Court") != -1) {return "district.court"}
}
function parseCitations(citationArray) { // this is a mess.
	let newItem = {}
	let newCitationArray = []
	let newCitationObject = {}
	let selectedCitation = {}
	let volumeVar = "volume"
	let reporterVar = "reporter"
	let firstPageVar = "firstPage"
	for (citation of citationArray) {
		if(citation) {
			citation = citation.match(/([0-9]+)(?:\s)([A-Za-z0-9\.]+)(?:\s)([0-9]+)/)
			if (citation) {
				newCitationArray.push(citation[2])
				newCitationObject[citation[2]] = {"volume": citation[1], "reporter": citation[2], "page": citation[3]}
			}
		}
	}
	let selectedReporter = newCitationArray[0]
	for (reporter of preferredReporters) {
		if (newCitationObject[reporter[0]])  {
			if (!(reporter[1])) {
				volumeVar = "yearAsVolume"
				reporterVar = "archive"
				firstPageVar = "archiveLocation"
			}
			selectedReporter = reporter[0]
			break
		}
	}
	selectedCitation[volumeVar] = newCitationObject[selectedReporter].volume
	selectedCitation[reporterVar] = newCitationObject[selectedReporter].reporter
	selectedCitation[firstPageVar] = newCitationObject[selectedReporter].page
	return selectedCitation
}

//Maps, Arrays, and Regex Patterns

//Helper patterns for Title and Case Name processing
var govPattern = /((city|county|cty.|state) of|(^state)|(^United States$)|(^U.S.$))/i 
var trimPattern = /(^( )|( |,|Inc.|Co.|LLC|LLLP|LLP)$)/mgi

//Helper array for using the preferred reporter.
var preferredReporters = [
	['Fed.Appx.', true],
	['U.S.', true],
	['NCBC', false], 
	['WL', false]
]




//Codes and Statutes
var codeRex = /(C\.F\.R\.|NCAC|U\.S\.C\.A\.|N\.C\.G\.S\.A\.|West\'s\sAnn\.Cal\.[a-zA-Z\.]+\sCode)/
var codeRexMap = {
	"NCAC": [/([0-9]+)(?:\sNCAC\s)([0-9\.]*)/, 1, 2],
	"C.F.R.": [/([0-9]+)(?:\sC\.F\.R\.[\s§]*)([0-9\.\-\–]*)/, 1, 2],
	"U.S.C.A.": [/([0-9]+)(?:\sU\.S\.C\.A\.[\s§]*)([0-9\.\-\–a-z]*)/, 1, 2],
	"N.C.G.S.A.": [/(?:N\.C\.G\.S\.A\.[\s§]*)([0-9\.\-\–a-zA-Z]*)/, "", 1],
	"West's Ann.Cal.Penal Code": [/(?:West's\sAnn\.Cal\.[a-zA-Z\.]*\sCode[\s§]*)([0-9a-z]*)/, "", 1]
}
var statuteCompilations = {
	"West's North Carolina General Statutes Annotated": "N.C.G.S.",
	"United States Code Annotated": "U.S.C.",
	"Massachusetts General Laws Annotated": "M.G.L."
}


//Fixing West's Abbreviations
var abbrevMap = {
	"NCAC": "N.C.A.C.",
	"U.S.C.A.": "U.S.C.",
	"N.C.G.S.A.": "N.C.G.S.",
	"West's Ann.Cal.Penal Code": "Cal. Penal Code",
}

//Federal Courts
var fedrex = /.*?(N\.D\. Georgia|W\.D\. Michigan|D\. Maine|W\.D\. Tennessee|S\.D\. Ohio|D\. South Carolina|S\.D\. Illinois|S\.D\. Florida|E\.D\. New York|S\.D\. West Virginia|N\.D\. Alabama|D\. South Dakota|D\. New Hampshire|D\. Kansas|D\. Maryland|D\. Delaware|E\.D\. Louisiana|M\.D\. Georgia|E\.D\. Michigan|D\. Utah|N\.D\. Texas|S\.D\. New York|W\.D\. Pennsylvania|W\.D\. Texas|D\. Puerto Rico|N\.D\. Iowa|E\.D\. Washington|W\.D\. Kentucky|N\.D\. Oklahoma|M\.D\. Louisiana|D\. Rhode Island|S\.D\. Alabama|S\.D\. Georgia|D\. Connecticut|E\.D\. Kentucky|W\.D\. North Carolina|W\.D\. Virginia|S\.D\. Indiana|E\.D\. North Carolina|S\.D\. California|D\. Minnesota|N\.D\. New York|D\. Nebraska|W\.D\. New York|S\.D\. Iowa|W\.D\. Washington|D\. Alaska|D\. Idaho|D\. Wyoming|M\.D\. North Carolina|N\.D\. Illinois|N\.D\. Mississippi|E\.D\. Texas|E\.D\. Virginia|S\.D\. Mississippi|D\. North Dakota|E\.D\. Tennessee|D\. New Mexico|D\. Montana|N\.D\. Ohio|E\.D\. Missouri|W\.D\. Oklahoma|D\. Colorado|C\.D\. Illinois|D\. Oregon|E\.D\. Oklahoma|D\. District of Columbia|N\.D\. Florida|W\.D\. Missouri|M\.D\. Pennsylvania|D\. Hawaii|D\. Nevada|N\.D\. California|E\.D\. California|W\.D\. Wisconsin|W\.D\. Arkansas|M\.D\. Tennessee|D\. Vermont|N\.D\. West Virginia|D\. New Jersey|M\.D\. Alabama|D\. Arizona|D\. Massachusetts|S\.D\. Texas|E\.D\. Pennsylvania|N\.D\. Indiana|E\.D\. Wisconsin|E\.D\. Arkansas|W\.D\. Louisiana|M\.D\. Florida|C\.D\. California).*/

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
	"United States District Court, D. District of Columbia": "us:dc.d",
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
}

//States

var staterex = /(?:^|.*\s+)(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)[.,]*(?:$|\s+.*)/

var stateMap = {
	"Alabama": "us:al",
	"Alaska": "us:ak",
	"Arizona": "us:az",
	"Arkansas": "us:ar",
	"California": "us:ca",
	"Colorado": "us:co",
	"Connecticut": "us:ct",
	"Delaware": "us:de",
	"Florida": "us:fl",
	"Georgia": "us:ga",
	"Hawaii": "us:hi",
	"Idaho": "us:id",
	"Illinois": "us:il",
	"Indiana": "us:in",
	"Iowa": "us:ia",
	"Kansas": "us:ks",
	"Kentucky": "us:ky",
	"Louisiana": "us:la",
	"Maine": "us:me",
	"Maryland": "us:md",
	"Massachusetts": "us:ma",
	"Michigan": "us:mi",
	"Minnesota": "us:mn",
	"Mississippi": "us:ms",
	"Missouri": "us:mo",
	"Montana": "us:mt",
	"Nebraska": "us:ne",
	"Nevada": "us:nv",
	"New Hampshire": "us:nh",
	"New Jersey": "us:nj",
	"New Mexico": "us:nm",
	"New York": "us:ny",
	"North Carolina": "us:nc",
	"North Dakota": "us:nd",
	"Ohio": "us:oh",
	"Oklahoma": "us:ok",
	"Oregon": "us:or",
	"Pennsylvania": "us:pa",
	"Rhode Island": "us:ri",
	"South Carolina": "us:sc",
	"South Dakota": "us:sd",
	"Tennessee": "us:tn",
	"Texas": "us:tx",
	"Utah": "us:ut",
	"Vermont": "us:vt",
	"Virginia": "us:va",
	"Washington": "us:wa",
	"West Virginia": "us:wv",
	"Wisconsin": "us:wi",
	"Wyoming": "us:wy"
}

//code = code.match(/(?:[0-9]+\s)([A-Za-z\.]+)(?:\s*[§0-9]+)/)[1]
//codeNum = codeNum.match(/([0-9\.\-]+)(?:[\.\s§]+)/)[1]
//section = code.match(/()/)[1]
//var code = ZU.xpathText(doc, '//div[@class="co_cites"]/text()')
//var section = ZU.xpathText(doc, '//title/text()')/** BEGIN TEST CASES **/
var testCases = []
/** END TEST CASES **/
