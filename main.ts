// deno-lint-ignore-file no-explicit-any
import express from 'npm:express'
import cors from 'npm:cors'
import yt from './yt/main.ts'

const app = express()
const port = 3666

app.use(cors())

app.use(express.static('public'))

app.get('/yt/0', async (req: any, res: any) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 500

  const iter = yt.db.list<any>({ prefix: ['videos'] })
  const list = []
  for await (const res of iter) list.push(res.value)
  const videos = list
    .sort((a: any, b: any) => b.meta.timestamp - a.meta.timestamp)
    .slice((page - 1) * limit, page * limit)

  res.json({
    page,
    limit,
    videos
  })
})

app.get('/yt/0/stats', async (_req: any, res: any) => {
  const iter = yt.db.list<any>({ prefix: ['videos'] })
  const list = []
  for await (const res of iter) list.push(res.value)
  const length = list.length

  res.json({
    length,
    videos: list
  })
})

let v = null

app.get('/yt/0/v', async (_req: any, res: any) => {
  res.json(v)
})

app.listen(port, () => {
  console.log(`𝒜𝓇𝓇𝒶𝓃𝑔𝒾𝓃𝑔 𝒟𝒶𝓉𝒶 𝐼𝓃𝓉𝑜 𝐿𝒾𝓈𝓉𝓈 http://localhost:${port}`)
})

async function stream() {
  let index = 3
  const iter = yt.db.list<any>({ prefix: ['videos'] })
  const list = []
  for await (const res of iter) list.push(res.value)

  while (list.length > 0) {
    v = list[index]
    console.log(v)
    await new Promise((resolve) => setTimeout(resolve, (v.seconds + 5) * 1000))
    index = (index + 1) % list.length
  }
}

stream()

if (process.argv[2] === 'init') {
  yt.init()
}
