// deno-lint-ignore-file no-explicit-any
import express from 'npm:express'
import yt from './yt/main.ts'

const app = express()
const port = 3666

app.use(express.static('public'))

app.get('/yt/0', async (req: any, res: any) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 500

  const iter = yt.db.list<any>({ prefix: ['videos'] })
  const list = []
  for await (const res of iter) list.push(res.value)
  const videos = list.sort((a: any, b: any) => b.timestamp - a.timestamp).slice((page - 1) * limit, page * limit)

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

app.listen(port, () => {
  console.log(`𝒜𝓇𝓇𝒶𝓃𝑔𝒾𝓃𝑔 𝒟𝒶𝓉𝒶 𝐼𝓃𝓉𝑜 𝐿𝒾𝓈𝓉𝓈 http://localhost:${port}`)
})

function init() {
  yt.init()
}

init()
