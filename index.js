var http = require('http'),
  net = require('net'),
  httpProxy = require('http-proxy'),
  url = require('url'),
  util = require('util')
  argv = require('yargs').argv;

var proxy = httpProxy.createServer();
var port = argv.port || 8001;
var useSingleLayer = +argv['single-layer'];

var server = http.createServer(function (req, res) {
  console.log(`Receiving reverse proxy request for: ${req.url}`);

  proxy.web(req, res, {target: req.url, secure: false});
}).listen(port);

server.on('connect', function (req, socket) {
  try {
    console.log(`Receiving reverse proxy request for: ${req.url}`);

    var serverUrl = url.parse('https://' + req.url);

    var srvSocket = net.connect(serverUrl.port, serverUrl.hostname, function() {
      if (useSingleLayer) {
        // write the response
        socket.write('HTTP/1.1 200 Connection Established\r\n' +
          'Proxy-agent: Node-Proxy\r\n' +
          '\r\n');
      }
      srvSocket.pipe(socket);
      socket.pipe(srvSocket);
    });
  } catch (error) {
    console.error(error);

    socket.write('HTTP/1.1 500 Connection Error\r\n' +
      'Proxy-agent: Node-Proxy\r\n' +
      '\r\n');

    socket.end();
  }
});

console.log(`mobile proxy server starts on port ${port}`);
if (useSingleLayer) {
  console.log('Stand alone reverse proxy is active');
}
