const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const exec = require('child_process').exec
const MongoClient = require('mongodb').MongoClient
const app = express();

app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const url = 'mongodb://localhost:27017/isucon'
let db, db_results
let queue = []
let benchNow = false

MongoClient.connect(url , (err, _db) => {
  console.log(err)
  db = _db
  db_results = db.collection('results')
})

const getIPAddr = request => {
  if (request.headers['x-forwarded-for'])
    return request.headers['x-forwarded-for']

  if (request.connection && request.connection.remoteAddress)
    return request.connection.remoteAddress

  if (request.connection.socket && request.connection.socket.remoteAddress)
    return request.connection.socket.remoteAddress

  return '0.0.0.0'
}

const startBench = (ip, cb) => {
  return exec(`/opt/go/bin/benchmarker -t http://${ip}/ -u /opt/go/src/github.com/catatsuy/private-isu/benchmarker/userdata`, cb)
}

app.get('/test', (req, res) => {
  res.writeHead(200, {"Content-Type": "text/event-stream", "Cache-contorol": "no-cache"})


  res.write('test')
  let p = 0
  const po = () => {
    res.write(new Buffer('' + p)) 
    p++
    if (p > 30) {
      res.end()
      return
    }
    setTimeout(po, 100)
  }
  po()
})

const checkQue = () => {
  if (queue.length <= 0 || benchNow)return
  queue.forEach(res => {
    res.write(`現在のベンチマーク待ち:${queue.map(res => res.team)}\n`)
  })
  
  const res = queue.shift()
  console.log('team: ' + res.team)
  console.log('start benchmark to ' + res.ip)
  res.write('ベンチマークを開始します\n')
  benchNow = true
  const benchProcess = startBench(res.ip, (err, stdout) => {
    console.log(err, stdout)

    const result = JSON.parse(stdout)
    result.team = res.team
    result.time = Date.now()
    db_results.insertOne(result)
    res.write(`チーム: ${result.team}のベンチマーク結果\n`)
    res.write(`pass: ${result.pass}\n`)
    res.write(`score: ${result.score}\n`)
    res.end(`message: ${result.message}\n`)

    benchNow = false
    checkQue()
  })
}

app.get('/:team/bench', (req, res) => {
  res.writeHead(200, {"Content-Type": "text/event-stream", "Cache-contorol": "no-cache"})
  
  const ip = getIPAddr(req)
  if (queue.find(que => que.ip === ip)) {
    res.end('すでにベンチマーク待ちになっています。\nベンチマークが終了してからもう一度してください。')
    return
  }

  res.ip = ip
  res.team = req.params.team
  queue.push(res)
  res.write(`現在のベンチマーク待ち:${queue.map(res => res.team)}\n`)
  checkQue()
})

app.get('/:team/result', (req, res) => {
  const limit = req.query.limit || 114514
  const team = req.params.team
  const results = db_results.find({team: team}, {_id: 0})
                    .limit(limit)
                    .toArray((err, docs) => {
                      if (err) {
                        res.status(500).send('エラーが発生しました')
                        return
                      }
                      res.json(docs)
                    })
})

app.get('/api/all', (req, res) => {
  db_results.find({}, {_id: 0})
    .toArray((err, docs) => {
      if (err) {
        console.log(err)
        res.status(500).send('エラーが発生しました')
        return
      }
      res.json(docs)
    })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(8081, '0.0.0.0')

