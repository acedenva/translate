const { Translate }= require('@google-cloud/translate')
const request = require('request-promise-native')
const puppeteer = require('puppeteer')
const fs = require('fs')
const app = new Translate()
const timeout = function (ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}
const setIntervalAsync = function (fn, ms) {
  fn().then(() => {
    setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};
const translate = async function (text) {
//	let translation = await app.translate(text, 'en')
//	return translation[0]
	return text
}
const fill = function (arr, length) {
	let i = arr.length
	for (i; i < length; i++) {
		let entry = {
			name: false,
			commentEn: false,
			commentDe: false,
		}
		arr.unshift(entry)
	}
	return arr 
}
function Chat () {
	this.chatLength = 30
	this.user = 'BrianM3ndoza'
	this.loadEntries = function () {
		if (fs.existsSync('./entries.json')) {
			let entriesJson = fs.readFileSync('./entries.json', 'utf8')
			this.entries = JSON.parse(entriesJson)
		} else {
			this.entries = [] 
			fs.writeFileSync('./entries.json', JSON.stringify(this.entries), 'utf8')
		}
	};this.loadEntries()
	this.saveEntries = function () {
		let entriesJson = JSON.stringify(this.entries)
		fs.writeFileSync('./entries.json', entriesJson, 'utf8')
	}
	this.createEntry= async function (comment,name) {
		let entry = {
			commentEn: '',
			commentDe: '',
			userId: 0,
			name: '',
			date: 0
		}

		let found = this.entries.find((entry)=>{
			return entry.commentDe == comment || entry.commentEn == comment
		})
		if (!found) {
			entry.commentDe = comment
			entry.commentEn = await translate(comment)
			entry.name = name
			this.entries.push(entry)
			this.saveEntries()
		}
	}
	this.addComments= async function () {
		let user = this.user 
//		let user = 'Drache_Offiziell'
		let apiUsersUrl = 'https://api.younow.com/php/api/broadcast/info/curId=0/user='
		let getApiOptions = { 
			method: 'GET',
			url: apiUsersUrl + user,
			headers: {
			'User-Agent':'Other'
			},
			transform: (rawbody)=>{
				let body = JSON.parse(rawbody)
				if (body.errorCode == 0 && body.comments) { 
					return body.comments
				}
			}
		}
		try {
			let comments = await request(getApiOptions)
			if (comments != undefined) {
				if (comments.length > 15) {
					 comments = comments.slice(15)//-this.chatLength)
				}
				for (comment of comments) {
					await this.createEntry(comment.comment, comment.name)
				}
			} else {
				console.log(`${user} has no commentators`)
			}
		} catch (err) {
			console.log (err)
		}
	}
	this.addCommentsReq = async function() {
		let url = 'http://y.drch.cf/?s=Drache_Offiziell'
//		let url = 'http://y.drch.cf/?s=anthonystacy123' 
		let browser = await puppeteer.launch()
		let page = await browser.newPage()
		let response = await page.goto(url,{waitUntil:'networkidle0'})
		fs.writeFileSync('./screnn.png', await page.screenshot(), 'binary')
		let dhandlers = await page.$$('#messages li')
		let commentsRaw = []
		for (dhandler of dhandlers) {
			jhandler = await dhandler.getProperty('innerText')
			commentsRaw.push(await jhandler.jsonValue())
		}
		await browser.close()
	}
	this.writeList = function () {
		let entriesSlice = this.entries.slice(-this.chatLength)
		if (entriesSlice.length < this.chatLength) {
			entriesSlice = fill(entriesSlice,  this.chatLength)
		}
		let fullString = '' 
		let commentString = ''
		entriesSlice.forEach(entry=>{
			if (entry.commentEn) {
				commentString =`<${entry.name}> ${entry.commentEn}\r\n` 
			} else {
				commentString = '\r\n'
			}
			fullString += commentString
		})
		fs.writeFileSync('./list.txt', fullString, 'utf8') 
	}
}
function main () {
	const chat = new Chat()
	setIntervalAsync(updateList,1000)
	function updateList() {
		return new Promise(async (resolve, reject)=>{
			await chat.addComments()
			chat.writeList()	
			resolve(null)
		})
	}
}main()

