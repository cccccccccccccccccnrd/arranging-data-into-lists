const express = require('express')
const yt = require('./yt')

const app = express()
const port = 3666

app.use(express.static('public'))

app.get('/yt/0', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 500

  const videos = await yt.db
    .find({})
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)

  res.json({
    page,
    limit,
    videos
  })
})

app.listen(port, () => {
  console.log(`𝒜𝓇𝓇𝒶𝓃𝑔𝒾𝓃𝑔 𝒟𝒶𝓉𝒶 𝐼𝓃𝓉𝑜 𝐿𝒾𝓈𝓉𝓈 http://localhost:${port}`)
})

function init() {
  yt.init()
}

init()
