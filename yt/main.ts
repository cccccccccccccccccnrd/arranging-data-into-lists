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
  const qs = [...new Set(list.map((v) => v.meta.q))].sort()
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
      const filtered = results.items.filter((v) => v.views === 0)

      for await (const v of filtered) {
        const video = await yts({ videoId: v.id })
        const d = new Date(video.uploadDate)
        const dd = new Date(new Date().setDate(new Date().getDate() - state.age))
        if ((video.views === 0 || Number.isNaN(video.views)) && d <= dd) {
          console.log(Date.now(), state.ii, q, video.ago, video.url)
          delete video.duration
          video.meta = {
            q,
            timestamp: Date.now()
          }
          v1.push(video)
        }
      }
      state.i++
    } catch (e) {
      if (v1.length > 0) {
        for await (const v of v1) {
          await db.set(['videos', v.videoId], v)
        }
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
