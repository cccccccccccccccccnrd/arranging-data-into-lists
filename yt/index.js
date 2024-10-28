const fs = require('fs')
const path = require('path')
const Datastore = require('nedb-promises')
const ytsr = require('ytsr')
const yts = require('yt-search')
const csv = require('csvtojson/v2')

const db = Datastore.create({ filename: path.join(__dirname, './v0.db'), autoload: true })

const state = {
  iterations: 100,
  qs: [],
  w: [],
  i: 0,
  ii: 0
}

async function load() {
  const all = await db.find({})
  const qs = [...new Set(all.map((v) => v.q))].sort()
  const data = await csv().fromFile(path.join(__dirname, '../utils/data/w.csv'))
  const w = [...data].map((w) => w.words).sort()
  console.log(Date.now(), all.length)
  return { qs, w }
}

async function request() {
  let v1 = []
  const q = state.w[state.ii]

  if (state.qs.includes(q)) {
    state.i = 0
    state.ii++
    console.log(Date.now(), state.ii, q, 'skipped')
    return request()
  }

  let results = await ytsr(q, { pages: 1 })

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
        if (info.views === 0 || info.views === NaN) {
          console.log(Date.now(), state.ii, q, info.url)
        } else {
          filtered.splice(filtered.indexOf(v), 1)
        }
      }
      console.log(Date.now(), state.ii, q, filtered.length)
      v1 = [...v1, ...filtered]
      state.i++
    } catch (e) {
      if (v1.length > 0) {
        console.log(Date.now(), state.ii, q, v1.length, 'inserted')
        await db.insert(v1)
      }
      state.i = 0
      state.ii++
      request()
      break
    }
  }
}

async function init() {
  const { qs, w } = await load()
  state.qs = qs
  state.w = w
  request()
}

module.exports = {
  db,
  init
}
