const fs = require('fs')
const path = require('path')
const ytsr = require('ytsr')
const yts = require('yt-search')
const csv = require('csvtojson/v2')

const state = {
  iterations: 50,
  i: 0,
  ii: 0,
  results: [],
  v0: [],
  w: []
}

async function load() {
  const files = fs.readdirSync(path.join(__dirname, './v0')).filter((file) => file.endsWith('.json'))
  const qs = files.map((file) => file.replace('.json', ''))
  const v0 = qs.map((q) => JSON.parse(fs.readFileSync(path.join(__dirname, `./v0/${q}.json`), 'utf8'))).flat()
  const data = await csv().fromFile(path.join(__dirname, '../utils/data/w.csv'))
  const w = [...data].map((w) => w.words)
  console.log(Date.now(), v0.length)
  return { v0, qs, w }
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
  const q = state.w[state.ii]
  results = await ytsr(q, { pages: 1 })

  while (state.i < state.iterations) {
    try {
      results = await ytsr.continueReq(results.continuation)
      const filtered = results.items
        .filter((v) => v.views === 0)
        .map((v) => {
          v.q = q
          return v
        })

      for await (const v of filtered) {
        const info = await yts({ videoId: v.id })
        console.log(info)
        if (info.views === 0 || info.views === NaN) {
          console.log(Date.now(), info.views, info.url)
        } else {
          filtered.splice(filtered.indexOf(v), 1)
        }
      }
      console.log(Date.now(), q, filtered.length)
      state.v0 = [...state.v0, ...filtered]
      v1 = [...v1, ...filtered]
      fs.writeFileSync(path.join(__dirname, `./v0/${q}.json`), JSON.stringify(v1, null, 2))
      state.i++
    } catch (e) {
      state.i = 0
      state.ii++
      request()
      break
    }
  }
}

async function init() {
  const { v0, qs, w } = await load()
  const last = qs.slice().reverse()[0]

  state.ii = w.indexOf(last) === -1 ? 0 : w.indexOf(last) + 1
  state.v0 = v0
  state.w = w

  request()
}

module.exports = {
  state,
  init
}
