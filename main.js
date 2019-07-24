const { Translate }= require('@google-cloud/translate')
const request = require('request-promise-native')
const puppeteer = require('puppeteer')
const fs = require('fs')
const app = new Translate()
async function translate(text) {
	console.log('ran')
	let translation = await app.translate(text, 'en')
	return translation
};//main()
function Chat () {
	this.loadEntries = function () {
		if (fs.existsSync('./entries.json')) {
			let entriesJson = fs.readFileSync('./entries.json', 'utf8')
			this.entries = JSON.parse(entriesJson)
		} else {
			fs.writeFileSync('./entries.json', '[]', 'utf8')
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
			entry.commentEn = (await translate(comment))[0]
			entry.name = name
			this.entries.push(entry)
			this.saveEntries()
		}
	}
	this.addComments= async function () {
	//	let user = 'Drache_Offiziell'
		let user = 'Drache_Offiziell'
		let apiUsersUrl = 'https://api.younow.com/php/api/broadcast/info/curId=0/user='
		let getApiOptions = { 
			method: 'GET',
			url: apiUsersUrl + user,
			headers: {
			'User-Agent':'Other'
			},
			transform: (rawbody)=>{
				let body = JSON.parse(rawbody)
				if (body.errorCode == 0) { 
					return body.comments
				}
			}
		}
		try {
			let comments = await request(getApiOptions)
			for (comment of comments) {
				await this.createEntry(comment.comment, comment.name)
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
		let entriesSlice = this.entries.slice(-10)
		let commentsString = '' 
		entriesSlice.forEach(entry=>{
			let commentString =`<${entry.name}> ${entry.commentEn}\r\n` 
			commentsString += commentString
		})
		fs.writeFileSync('./list.txt', commentsString, 'utf8') 
	}
}
async function main () {
	const chat = new Chat()
	setInterval(async ()=> {
		await chat.addComments()
		chat.writeList()
	},
	2000)
};main()
