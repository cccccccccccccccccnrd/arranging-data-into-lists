// deno-lint-ignore-file no-explicit-any
import path from 'node:path'
import { nextTick } from 'node:process'
import ytsr from 'npm:ytsr'
import yts from 'npm:yt-search'
import { parse } from 'jsr:@std/csv'

const db = await Deno.openKv(path.join(import.meta.dirname, 'yt.db'))

const state = {
  age: 3,
  iterations: 100,
  qs: [],
  w: [],
  i: 0,
  ii: 0
}

async function load() {
  const iter = db.list<any>({ prefix: ['videos'] })
  const list = []
  for await (const res of iter) list.push(res.value)
  const qs = [...new Set(list.map((v) => v.q))].sort()
  const w: any = parse(await Deno.readTextFile(path.join(import.meta.dirname, '../utils/data/w.csv')))
    .flat()
    .sort()
  console.log(Date.now(), list.length)
  return { qs, w }
}

async function request() {
  let v1 = []
  const q = state.w[state.ii]

  if (state.qs.includes(q)) {
    state.i = 0
    state.ii++
    console.log(Date.now(), state.ii, q, 'skipped')
    return nextTick(() => {
      request()
    })
  }

  let results = await ytsr(q, { pages: 1 })

  while (state.i < state.iterations) {
    try {
      results = await ytsr.continueReq(results.continuation)
      const filtered = results.items
        .filter((v) => v.views === 0)
        .map((v) => {
          v.q = q
          v.timestamp = Date.now()
          return v
        })

      for await (const v of filtered) {
        const info = await yts({ videoId: v.id })
        const d = new Date(info.uploadDate)
        const dd = new Date(new Date().setDate(new Date().getDate() - state.age))
        console.log(Date.now(), state.ii, info.uploadDate, d, dd, d < dd)
        if ((info.views === 0 || Number.isNaN(info.views)) && d <= dd) {
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
        for (const v of v1) {
          await db.set(['videos', v.id], v)
        }
        console.log(Date.now(), state.ii, q, v1.length, 'inserted')
      }
      state.i = 0
      state.ii++
      nextTick(() => {
        request()
      })
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

export default {
  init,
  db
}
