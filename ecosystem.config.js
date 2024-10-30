module.exports = {
  apps: [
    {
      name: 'ls',
      script: './main.ts',
      interpreter: 'deno',
      interpreterArgs: 'run --allow-net --allow-env --allow-read --allow-write'
    }
  ]
}
