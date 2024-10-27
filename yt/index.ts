import fs from 'fs'
import path from 'path'
import ytsr from 'ytsr'
import csv from 'csvtojson/v2'
import * as ytscr from 'ytscr'
/* import sw from 'stopwords' */

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const iterations = 50
let i = 0
let ii = 0
let results
export let { v0, qs } = load()
const w = [...(await csv().fromFile(path.join(__dirname, '../utils/data/w.csv')))].map((w) => w.words)

function load() {
  const files = fs.readdirSync(path.join(__dirname, './v0')).filter((file) => file.endsWith('.json'))
  const qs = files.map((file) => file.replace('.json', ''))
  const v0 = qs.map((q) => JSON.parse(fs.readFileSync(path.join(__dirname, `./v0/${q}.json`), 'utf8'))).flat()
  console.log(Date.now(), v0.length)
  return { v0, qs }
}

function split() {
  const qs = new Set(v0.map((v) => v.q))
  qs.forEach((q) => {
    const v = v0.filter((v) => v.q === q)
    fs.writeFileSync(path.join(__dirname, `./v0/${q}.json`), JSON.stringify(v, null, 2))
  })
}

async function request() {
  let v1 = []
  const q = w[ii]
  results = await ytsr(q, { pages: 1 })

  while (i < iterations) {
    try {
      results = await ytsr.continueReq(results.continuation)
      const filtered = results.items
        .filter((v) => v.views === 0)
        .map((v) => {
          v.q = q
          return v
        })

      for await (const v of filtered) {
        const info = await ytscr.getInfo(v.id)
        if (info.details.viewCount > 0) {
          filtered.splice(filtered.indexOf(v), 1)
        } else {
          console.log(Date.now(), info.details.viewCount, `https://www.youtube.com/watch?v=${info.details.id}`)
        }
      }
      console.log(Date.now(), q, filtered.length)
      v0 = [...v0, ...filtered]
      v1 = [...v1, ...filtered]
      fs.writeFileSync(path.join(__dirname, `./v0/${q}.json`), JSON.stringify(v1, null, 2))
      i++
    } catch (e) {
      i = 0
      ii++
      request()
      break
    }
  }
}

export function init() {
  const last = qs.slice().reverse()[0]
  ii = w.indexOf(last) === -1 ? 0 : w.indexOf(last) + 1
  request()
}
