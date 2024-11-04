// deno-lint-ignore-file no-explicit-any
import path from 'node:path'
import { nextTick } from 'node:process'
import ytsr from 'npm:ytsr'
import yts from 'npm:yt-search'
import { parse } from 'jsr:@std/csv'
import { Video } from './types.ts'

const db = await Deno.openKv(path.join(import.meta.dirname, 'yt.db'))

const state = {
  age: 1 /* in days */,
  q: '',
  qs: [],
  w: [],
  ii: 0
}

async function load() {
  const iter = db.list({ prefix: ['videos'] })
  const list = []
  for await (const res of iter) list.push(res.value)
  const qs = [...new Set(list.map((v) => v.meta.q))].sort()
  const w: any = parse(await Deno.readTextFile(path.join(import.meta.dirname, '../utils/data/w.csv')))
    .flat()
    .sort()
  console.log(Date.now(), list.length)
  return { qs, w }
}

async function insert(video: Video) {
  const res = await db
    .atomic()
    .check({ key: ['videos', video.videoId], versionstamp: null })
    .set(['videos', video.videoId], video)
    .commit()

  if (res.ok) {
    console.log(Date.now(), state.ii, state.w[state.ii], video.title)
  }

  return res
}

async function check(v) {
  const video: Video = await yts({ videoId: v.id })
  const d = new Date(video.uploadDate)
  const dd = new Date(new Date().setDate(new Date().getDate() - state.age))

  if ((video.views === 0 || Number.isNaN(video.views)) && d <= dd) {
    delete video.duration
    video.meta = {
      q: state.w[state.ii],
      timestamp: Date.now()
    }
    return await insert(video)
  } else {
    return false
  }
}

async function request() {
  const q = state.w[state.ii]
  const results = await ytsr(q, { pages: Infinity })
  const filtered = results.items.filter((v) => v.views === 0)
  console.log(Date.now(), state.ii, q, filtered.length)

  for await (const v of filtered) {
    await check(v)
  }

  state.ii++
  nextTick(() => {
    request()
  })
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
