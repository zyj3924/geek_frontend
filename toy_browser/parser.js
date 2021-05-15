
const css  = require('css')
const layout = require('./layout')
const EOF = Symbol('EOF')
let currentToken = null
let currentAttribute = null
let stack = [{type: 'document', children:[]}]
let currentTextNode = null
let rules = [];

function match(ele, selector){
    if (!selector || !ele.attributes)return

    if (selector.charAt(0) === '#'){
        let attr = ele.attributes.filter((a) => a.name === 'id')[0]
        const str = selector.replace('#', '')
        if (attr && (attr.value === str)){
            return true
        }
    } else if(selector.charAt(0) === '.'){
        let attr = ele.attributes.filter((a) => a.name === 'class')[0]
        if (attr && attr.value === selector.replace('.', '')){
            return true
        }
    } else {
        if (ele.tagName === selector) {
            return true
        }
    }
    return false
}

function computeSpecificity(selectorParts){
    let specificity = [0,0,0,0]
    for (let s of selectorParts) {
        if (s.charAt(0) === '#'){
            specificity[1] = specificity[1] + 1
        } else if (s.charAt(0) === '.'){
            specificity[2] = specificity[2] + 1
        } else {
            specificity[3] = specificity[3] + 1
        }
    }
    return specificity
}
function compareSepcificity(sp1,sp2){
    if (sp1[0] != sp2[0]) {
        return sp1[0] - sp2[0]
    }
    if (sp1[1] !=  sp2[1]){
        return sp1[1] - sp2[1]
    }
    if (sp1[2] !=  sp2[2]){
        return sp1[2] - sp2[2]
    }
    return sp1[3] - sp2[3]
}
function computeCss(element){
    const elements = stack.slice().reverse()

    if(!element.computedStyle){
        element.computedStyle = {}
    }

    for(let rule of rules) {
        const selectorParts = rule.selectors[0].split(" ").reverse()
        if(!match(element, selectorParts[0]))continue
        let matched = false
        let j = 1;
        for(let i = 0; i < elements.length; i++) {
            if (j >= selectorParts.length){
                matched = true
                continue
            }
           if (match(elements[i], selectorParts[j])){
               j++
           }
        }

        if(matched){
            let currentSpecificity = computeSpecificity(selectorParts)
            for (let d of rule.declarations) {
                if (!element.computedStyle[d.property]){
                    element.computedStyle[d.property] = {}
                }
                const elementSpecifity = element.computedStyle[d.property]['specificity']
                if(!elementSpecifity || (elementSpecifity && compareSepcificity(currentSpecificity, elementSpecifity) > 0)) {
                    element.computedStyle[d.property].value = d.value
                    element.computedStyle[d.property]['specificity'] = currentSpecificity
                }
                
            }
            console.log(element.computedStyle)
        }
        
    }
    

    
}

function addCssRules (text) {
    var ast = css.parse(text)
    rules.push(...ast.stylesheet.rules)
}


function emit(t){
   let top = stack[stack.length - 1]

    if (t.type === 'startTag') {
        
        let element = {
            type: 'element',
            tagName: t.name,
            attributes:[],
            children:[]
        }
        for (let p in t) {
            if (p != 'type' && p != 'name') {
                element.attributes.push({
                    name: p,
                    value: t[p]
                })
            }
        }

        top.children.push(element)
        element.parent = top

        if (!t.isSlefClosing) {
            stack.push(element)
        }
        computeCss(element)
        currentTextNode = null

    } else if (t.type === 'endTag'){
        if (t.name != top.tagName) {
            throw new Error('无法配对开始和结束标签')
        } else {
            if (t.name === 'style') {
                addCssRules(top.children[0].content)
            }
            layout(top)
            stack.pop()
            currentTextNode = null
        }
    } else if (t.type === 'text') {
        if (currentTextNode === null) {
            currentTextNode = {
                type: 'text',
                content: ''
            }
            top.children.push(currentTextNode)
        }
        currentTextNode.content += t.content
    }
    //console.log(stack)
}
function data(c){
    if (c === '<') {
        return tagOpen
    } else if (c === EOF) {
        emit({
            type: 'EOF'
        })
    } else {
        emit({
            type: 'text',
            content: c
        })
        return data
    }
}

function tagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)){
        currentToken = {
            type: 'startTag',
            name: ''
        }
        return tagName(c)
    }else if (c === '/') {
        currentToken = {
            type: 'endTag',
            name: ''
        }
        return endTagOpen
    } else if(c === '>') {
        throw new Error('err')
    } else {
        return data
    }
}

function endTagOpen(c){
    if (c.match(/^[a-zA-Z]$/)) {
        return tagName(c)
    }else if (c === '>') {
        throw new Error('err3')
    } else if (c === EOF){
        throw new Error('err4')
    }
}
function tagName(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken.name += c
        return tagName
    } else if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName
    } else if (c === '/'){
        return selfClosingStartTag
    } else if(c === '>') {
        emit(currentToken)
        return data
    } else {
        return data
    }
}

function beforeAttributeName(c){
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName
    } else if (c === '>') {
        emit(currentToken)
        return data
    } else if(c === '/'){
        return selfClosingStartTag
    } else if (c === '='){
        
    } else {
        currentAttribute = {
            name: '',
            value: ''
        }
        return attributeName(c)
    }
}

function attributeName(c){
    if( c === '=') {
        return beforeAttributeVlalue
    } else if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>') {
        return beforeAttributeName(c)
    } else if (c === '\u0000') {
        throw new Error('出现空字符')
    } else if (c === EOF) {
        throw new Error('文件结束了')
    } else {
        currentAttribute.name += c
        return attributeName
    }
}

function beforeAttributeVlalue(c) {
    if (c === '\"'){
        return doubleQuotedAttributeValue
    } else if (c === '\'') {
        return singleQuotedAttributeValue
    } else if (c === '\u0000'){
        throw new Error('beforeAttributeVlalue:出现空字符')
    } else {
        return unQuotedAttributeValue(c)
    }
}

function singleQuotedAttributeValue(c) {
    if (c === '\'') {
        return afterAttributeValue
    } else if (c === '\u0000'){
        throw new Error('出现空字符')
    } else if (c === EOF) {
        throw new Error('文件结束了')
    } else {
        currentAttribute.value += c
        return singleQuotedAttributeValue
    }
}

function doubleQuotedAttributeValue(c) {
    if (c === '\"') {
        return afterAttributeValue
    } else if (c === '\u0000'){
        throw new Error('出现空字符')
    } else if (c === EOF) {
        throw new Error('文件结束了')
    } else {
        currentAttribute.value += c
        return doubleQuotedAttributeValue
    }
}

function afterAttributeValue(c){
    if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value
        return beforeAttributeName(c)
    } else {
        throw new Error('属性值结束书写错误')
    }
}

function unQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>'){
        currentToken[currentAttribute.name] = currentAttribute.value
        return beforeAttributeName(c)
    } else if(c === '=' || c === '\u0000' || c === EOF){
        throw new Error('属性值格式错误')
    } else {
        currentAttribute.value += c
        return unQuotedAttributeValue
    }
}

function selfClosingStartTag(c){
    if(c === '>') {
        currentToken.isSlefClosing = true
        emit(currentToken)
        return data
    } else {
        throw new Error('err2')
    }
}

module.exports.parseHTML = function (html) {
    let state = data
    for( let c of html) {
        state = state(c)
    }
    status = state(EOF)
    return stack[0]
}