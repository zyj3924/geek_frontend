class XRegexp {
    constructor(source, flag, root = 'root') {
        this.table = new Map()
        this.regexp = new RegExp(this.compileRegExp(source, root, 0).source, flag)
    }
    compileRegExp(source, name, start) {
        if (source[name] instanceof RegExp) {
            return {
                source: source[name].source,
                length: 0
            }
        }
        let length = 0
        let regexp = source[name].replace(/\<([^>]+)\>/g, (str, $1) => {
            this.table.set(start + length, $1)
            this.table.set($1, start + length)
            ++length
            let r = this.compileRegExp(source, $1, start + length)
            length += r.length
            return '(' + r.source + ')'
        })
        return {
            source: regexp,
            length: length
        }
    }
    exec(string) {
        let r = this.regexp.exec(string)
        for(let i = 1; i < r.length; i++) {
            if (r[i] !== void 0) {
                r[this.table.get(i - 1)] = r[i]
            }
        }
        return r
    }
    get lastIndex() {
        return this.regexp.lastIndex
    }
    set lastIndex(val) {
        return this.regexp.lastIndex = val
    }
}

export function* scan(str) {
    let regexp = new XRegexp({
        InputElement: "<Whitespace>|<LineTerminator>|<Comments>|<Token>",
        Whitespace: / /,
        LineTerminator: /\n/,
        Comments: /\/\*(?:[^*]|\*[^\/])*\*\/|\/\/[^\n]*/,
        Token: "<Literal>|<Keywords>|<Identifier>|<Punctuator>",
        Literal: "<NumbericLiteral>|<BooleanLiteral>|<StringLiteral>|<NullLiteral>",
        NumbericLiteral: /(?:[1-9][0-9]*|0)(?:\.[0-9]*)?|\.[0-9]+/,
        BooleanLiteral: /true|false/,
        StringLiteral: /\"(?:[^"\n]|\\[\s\S])*\"|\'(?:[^'\n]|\\[\s\S])*\'/,
        NullLiteral: /null/,
        Keywords: /if|else|for|function|var|let/,
        Identifier: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
        Punctuator: /\+|\,|\?|\:|\{|\}|\.|\(|\)|\=|\<|\+\+|\=\=|\=\>|\*|\[|\]|;/
    }, "g", "InputElement")

    while(regexp.lastIndex < str.length) {
        let r = regexp.exec(str)

        if(r.Whitespace) {

        } else if(r.LineTerminator) {
            
        } else if(r.Comments) {
            
        } else if(r.NumbericLiteral) {
            yield {
                type: "NumbericLiteral",
                value: r[0]
            }
        } else if(r.BooleanLiteral) {
            yield {
                type: "BooleanLiteral",
                value: r[0]
            }
        } else if(r.StringLiteral) {
            yield {
                type: "StringLiteral",
                value: r[0]
            }
        } else if(r.NullLiteral) {
            yield {
                type: "NullLiteral",
                value: r[0]
            }
        } else if(r.Identifier) {
            yield {
                type: "Identifier",
                name: r[0]
            }
        } else if(r.Keywords) {
            yield {
                type: r[0]
            }
        } else if(r.Punctuator) {
            yield {
                type: r[0]
            }
        } else {
            throw new Error("unexpected token " + r[0])
        }
        if (!r[0].length) {
            break;
        }
    }
    yield {
        type: "EOF"
    }
}
let source = (`
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                let cell = document.createElement("div")
                cell.classList.add("cell")
                cell.innerText = pattern[i * 3 + j] == 2 ? "❎" :
                    pattern[i * 3 + j] == 1 ? "⭕️" : ""
                cell.addEventListener("click", () => userMove(j, i))
                board.appendChild(cell)
            }
            board.appendChild(document.createElement("br"))
        }
    `)