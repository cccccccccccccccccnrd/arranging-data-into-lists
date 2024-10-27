import express from 'express'
import 'dotenv/config.js'
import * as yt from './yt'

const app = express()
const port = 3666

app.use(express.static('public'))

app.get('/yt/0', async (req, res) => {
  const v0 = yt.v0.slice(500, 1500)
  res.json(v0)
})

app.listen(port, () => {
  console.log(`𝒜𝓇𝓇𝒶𝓃𝑔𝒾𝓃𝑔 𝒟𝒶𝓉𝒶 𝐼𝓃𝓉𝑜 𝐿𝒾𝓈𝓉𝓈 http://localhost:${port}`)
})

function init() {
  yt.init()
}

init()