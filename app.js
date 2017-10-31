const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const spawn = require('child_process').spawn
const app = express();

app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

let benchNow = false

const startBench = (ip) => {
  console.log(ip, ' bench start')
  return spawn(`/home/isucon/isucon6q/isucon6q-bench` ,["-datadir", "/home/isucon/isucon6q/data", "-target", `http://${ip}`])
}

app.get('/test', (req, res) => res.send('po'))

app.get('/benchnow', (req, res) => {
  res.json({benchNow: benchNow})
})

app.post('/bench', (req, res) => {
  if (benchNow) {
    res.json({benchNow, message: 'bench now'})
    return
  }
  res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-control': 'no-cache'})
  console.log(req.body)
  const ip = req.body.ip
  benchNow = true
  const ps = startBench(ip) 

  ps.on('exit', code => {
    console.log('end bench')
    res.end()
    benchNow = false
  })

  ps.stdout.on('data', data => {
    res.write(data.toString())
    console.log(data.toString())
  })
  ps.stderr.on('data', data => {
    res.write(data.toString())
    console.log(data.toString())
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

app.listen(29931, '0.0.0.0')

