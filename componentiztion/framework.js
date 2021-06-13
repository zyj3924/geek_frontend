export function createElement(type, attrs, ...childrens){
    let element
    if (typeof type === 'string'){
         element = new ElementWrapper(type)
    }else{
         element = new type;
    }
    
    for (let name in attrs) {
        element.setAttribute(name, attrs[name])
    }
    for (let child of childrens){
        if (typeof child === 'string'){
            child = new TextWrapper(child)
        }
        element.appendChild(child)
    }
    return element
}
export class Component{
    constructor(){

    }
    setAttribute(name, value){
        this.root.setAttribute(name, value)
    }
    appendChild(child){
        child.mountTo(this.root)
    }
    mountTo(parent){
        parent.appendChild(this.root)
    }
}
class TextWrapper{
    constructor(content){
        this.root = document.createTextNode(content)
    }
    mountTo(parent){
        parent.appendChild(this.root)
    }
}
class ElementWrapper{
    constructor(type){
        this.root = document.createElement(type)
    }
    setAttribute(name, value){
        this.root.setAttribute(name, value)
    }
    appendChild(child){
        child.mountTo(this.root)
    }
    mountTo(parent){
        parent.appendChild(this.root)
    }
}
