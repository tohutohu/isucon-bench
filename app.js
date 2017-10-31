const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const exec = require('child_process').exec
const app = express();

app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

let benchNow = false

const startBench = (ip, cb) => {
  console.log(ip, ' bench start')
  return exec(`/opt/go/bin/benchmarker -t http://${ip}/ -u /opt/go/src/github.com/catatsuy/private-isu/benchmarker/userdata`, cb)
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
  const ip = req.body.ip
  benchNow = true
  startBench(ip, (err, stdout) => {
    console.log(err, stdout)
    const po = stdout.match(/{.*}/)
    res.send(JSON.parse(po))
    benchNow = false
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

