import {Component} from './framework'



export class Carousel extends Component{
    constructor(){
        super()
        this.attributes = {}
    }
    setAttribute(name, value){
        console.log(this.attributes)
        this.attributes[name] =  value
    }
    render(){
        this.root = document.createElement('div')
        this.root.classList.add('carousel')
        for (let child of this.attributes.src){
            let childImg = document.createElement('div')
            childImg.style.backgroundImage = `url(${child})`
            this.root.appendChild(childImg)
        }

        let position = 0
        this.root.addEventListener('mousedown', event => {
            let startX = event.clientX
            let children = this.root.children
            let move = event => {
                let x = event.clientX - startX
                let current = position - ((x - x % 500) / 500);
                for (let offset of [-1,0,1]) {
                    let pos = current + offset
                    pos = (pos + children.length) % children.length

                    children[pos].style.transition = 'none'
                    children[pos].style.transform = `translateX(${-pos * 500 + offset * 500 + x % 500}px)`
                }
                console.log('mousemove')
            }
            let up = event => {
                let x = event.clientX - startX
                position = position - Math.round(x/500)
                for (let offset of [0, -Math.sign(Math.round(x/500)-x+250*Math.sign(x))]) {
                    let pos = position + offset;
                    pos = (pos+children.length) % children.length
                    children[pos].style.transition = 'none'
                    children[pos].style.transform = `translateX(${-pos * 500 + offset*500}px)`
                }
                document.removeEventListener('mousemove', move)
                document.removeEventListener('mouseup', up)
            }
            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
        })
        
        /*let currentIndex = 0
        setInterval(()=>{
            let children = this.root.children
            let nextIndex = (currentIndex + 1) % children.length

            let current = children[currentIndex]
            let next = children[nextIndex]

            next.style.transition = 'none'
            next.style.transform = `translateX(${100 - nextIndex * 100 }%)`
            
            
            setTimeout(() => {
                next.style.transition  = ''
                current.style.transform = `translateX(${ -100-100 * currentIndex}%)`
                next.style.transform = `translateX(${-100 * nextIndex}%)`
                currentIndex = nextIndex
            }, 16)
        },1000)*/
        return this.root;
    }
    mountTo(parent){
        parent.appendChild(this.render())
    }
}