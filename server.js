const http = require('http');

http.createServer((request, response) => {
    let body = []
    request.on('error', (err) => {
        console.log(err)
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        response.writeHead(200, {'Content-Type':'text/html'});
        response.end(`<html   lang="en">
<head data-id='100'>
<title data-id=10></title>
</head>
<style>
p{
    width:100%
}
p #my_header{
    width:50px;
    height:50px
}
p img{
    width:45px;
    height:45px
}
</style>
<body style="height:100px">
<p data-id='2222'>
 <img id="my_header" src="https://static001.geekbang.org/account/avatar/00/19/e4/6d/91ff89f0.jpg"/>
</p>
<br/>
    Hello word
</body>
</html>`);
    })
}).listen(8088)

console.log('server started')
