const net = require('net')
const parser = require('./parser')

class TrunkeBodyParser{
    constructor(){
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END = 1;
        this.READING_TRUNK = 2;
        this.WAITING_NEW_LINE = 3;
        this.WAITING_NEW_LINE_END = 4;
        this.length = 0;
        this.content = [];
        this.isFinish = false;
        this.current = this.WAITING_LENGTH;
    }
    receiveChar(char) {
        if (this.current === this.WAITING_LENGTH) {
            if (char === '\r') {
                if (this.length === 0) {
                    this.isFinish = true
                }
                this.current = this.WAITING_LENGTH_LINE_END
            } else {
                this.length *= 16
                this.length += parseInt(char, 16)
            }
        } else if (this.current === this.WAITING_LENGTH_LINE_END){
            if (char === '\n'){
                this.current = this.READING_TRUNK
            }
        } else if (this.current === this.READING_TRUNK) {
            this.content.push(char)
            this.length--
            if (this.length === 0) {
                this.current = this.WAITING_NEW_LINE
            }
        }else if (this.current === this.WAITING_NEW_LINE) {
            if(char === '\r') {
                this.current = this.WAITING_NEW_LINE_END
            }
        }else if(this.current === this.WAITING_NEW_LINE_END){
            if(char === '\n') {
                this.current = this.WAITING_LENGTH
            }
        }
    }
}

class ResponseParser{
    constructor() {
        this.WATING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;
        this.WAITING_HEADER_NAME = 2;
        this.WAITING_HEADER_SPACE = 3;
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5;
        this.WAITING_HEADER_BLOCK_END = 6;
        this.WAITING_BODY = 7 ;

        this.current = this.WAITING_STATUS_LINE_END;
        this.statusLine = "";
        this.headers = {};
        this.headerName = "";
        this.headerValue = "";
        this.bodyParser = null;
    }
    get isFinish() {
        return this.bodyParser && this.bodyParser.isFinish
    }
    get response(){
        //console.log(this.statusLine)
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join('')
        }
    }
    receive(string) {
        // console.log(string)
        for(let i = 0; i < string.length; i++) {
            this.receiveChar(string.charAt(i))
        }
    }
    receiveChar (char) {
        if(this.current === this.WATING_STATUS_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_STATUS_LINE_END
            } else {
                this.statusLine += char
            }
        } else if (this.current === this.WAITING_STATUS_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME
            }
        } else if (this.current === this.WAITING_HEADER_NAME) {
            if (char === ':'){
                this.current = this.WAITING_HEADER_SPACE
            } else if(char === '\r') {
                this.current = this.WAITING_HEADER_BLOCK_END
                if (this.headers['Transfer-Encoding'] === 'chunked'){
                    this.bodyParser = new TrunkeBodyParser()
                }
            } else {
                this.headerName += char
            }
        } else if (this.current === this.WAITING_HEADER_SPACE) {
            if(char === ' '){
                this.current = this.WAITING_HEADER_VALUE
            }
        } else if (this.current === this.WAITING_HEADER_VALUE) {
            if (char === '\r'){
                this.current = this.WAITING_HEADER_LINE_END
                this.headers[this.headerName] = this.headerValue
                this.headerValue = ''
                this.headerName = ''
            } else {
                this.headerValue += char
            }
        } else if (this.current === this.WAITING_HEADER_LINE_END) {
            if (char === '\n'){
                this.current = this.WAITING_HEADER_NAME
            }
        } else if (this.current === this.WAITING_HEADER_BLOCK_END) {
            if(char === '\n') {
                this.current = this.WAITING_BODY
            }
        } else if (this.current === this.WAITING_BODY) {
            this.bodyParser.receiveChar(char)
        }
    }
}

class Request{
    constructor(options){
        this.method = options.method || 'GET';
        this.port = options.port || 80;
        this.host = options.host;
        this.path = options.path || '/';
        this.body = options.body || {};
        this.headers = options.headers || {}
        if (!this.headers['Content-Type']){
            this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        if (this.headers['Content-Type'] === 'application/json') {
            this.bodyText = JOSN.stringify(this.body)
        }else if(this.headers['Content-Type'] === 'application/x-www-form-urlencoded'){
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&');
        }
        this.headers['Content-Length'] = this.bodyText.length
    }

    toString () {
        const str = `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join("\r\n")}\r\n\r\n${this.bodyText}`;
// const str = `${this.method} ${this.path} HTTP/1.1\r
// ${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join("\r\n")}\r
// \r
// ${this.bodyText}`
        return str
    }

    send (connection) {
        return new Promise((resolve, reject)=>{
            const parser = new ResponseParser
            if(connection) {
                connection.write(this.toString())
            }else {
                connection = net.createConnection({
                    port: this.port,
                    host: this.host
                }, () => {
                    connection.write(this.toString())
                })
            }
            connection.on('data', (data) => {
               const a = data.toString
                parser.receive(data.toString())
                if(parser.isFinish){
                    resolve(parser.response)
                    connection.end()
                }
            })
            connection.on('error', (err) => {
                reject(err)
                connection.end()
            })
        })
    }
}

void async function (){
    const request = new Request({
        method: "GET",
        host: '127.0.0.1',
        port: '8088',
        path: '/',
        headers: {
            'X-Foo2': 'customed'
        },
        body: {
            name: 'zyj',
            job: 'aaa'
        }
    });
    let response = await request.send();
    let dom =  parser.parseHTML(response.body)
}()