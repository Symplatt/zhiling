const http=require('node:http'),path=require('node:path'),fs=require('node:fs/promises')
const {LibraryStore}=require('./store.cjs')
const root=path.resolve(__dirname,'..'),port=Number(process.env.ZHILING_PORT||5173)
const store=new LibraryStore(process.env.ZHILING_DATA_DIR||path.join(root,'data'))
const dist=path.join(root,'dist')
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.ico':'image/x-icon','.png':'image/png','.svg':'image/svg+xml'}
const server=http.createServer(async(req,res)=>{
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
  try {
    if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host))return json(403,{error:'只允许本机访问。'})
    const url=new URL(req.url,`http://127.0.0.1:${port}`)
    if(url.pathname==='/api/health')return json(200,{app:'zhiling',version:2})
    if(url.pathname==='/api/library'){
      if(req.method==='GET')return json(200,await store.load())
      if(req.method!=='PUT')return json(405,{error:'不支持该操作。'})
      if(req.headers['x-zhiling-client']!=='local'||(req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin)))return json(403,{error:'不允许跨站修改。'})
      let size=0,chunks=[]
      for await (const chunk of req){size+=chunk.length;if(size>128*1024*1024)return json(413,{error:'数据超过 128 MB。'});chunks.push(chunk)}
      const {data,revision}=JSON.parse(Buffer.concat(chunks).toString('utf8'))
      return json(200,await store.save(data,revision))
    }
    if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'不支持该操作。'})
    const file=path.resolve(dist,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname))
    if(!file.startsWith(dist+path.sep))return json(403,{error:'无法访问此路径。'})
    const body=await fs.readFile(file)
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'})
    res.end(req.method==='HEAD'?undefined:body)
  }catch(e){json(e.status|| (e.code==='ENOENT'?404:500),{error:e.message})}
})
server.listen(port,'127.0.0.1',()=>console.log(`织灵已就绪：http://127.0.0.1:${port}`))
server.on('error',error=>{console.error(error.message);process.exit(1)})
