

class Dispather{
    constructor(element){
        this.element = element
    }
    dispath(type ,properties){
        let event = new Event(type);
        for (let name in properties){
            event[name] = properties[name]
        }
        this.element.dispatchEvent(event)
    }
}

class Lisenter {
    constructor (element, Recognizer) {
        this.recognizer = Recognizer
        this.element = element
        let contexts = new Map()
        let isListening = false
        element.addEventListener('mousedown', (event) => {
            let context = Object.create(null)
            contexts.set('mouse'+(1 << event.button), context)
            this.recognizer.start(event, context)
        
            let mv = (event) => {
                let button = 1
                let key
                while(button <= event.buttons){
                    if (button & event.buttons) {
                        if (button === 2) {
                            key = 4
                        } else if (button === 4){
                            key = 4
                        } else {
                            key = button
                        }
                        context = contexts.get('mouse'+key)
                        this.recognizer.move(event, context)
                    }
                    button = button << 1
                }
                
            }
        
            let up = (event) => {
                context = contexts.get('mouse'+(1 << event.button))
                this.recognizer.end(event, context)
                contexts.delete('mouse'+(1 << event.button))
        
                if (isListening) {
                    document.removeEventListener('mousemove', mv)
                    document.removeEventListener('mouseup', up)
                    isListening = false
                }
                
            }
            if (!isListening) {
                document.addEventListener('mousemove', mv)
                document.addEventListener('mouseup', up)
                isListening = true
            }
            
        })
        
        element.addEventListener('touchstart', (event) => {
            console.log(event.changedTouches)
            for (let touch of event.changedTouches){
                let context = Object.create(null)
                contexts.set(touch.identifier, context)
                this.recognizer.start(touch, context)
            }
        })
        
        element.addEventListener('touchmove', (event) => {
            for (let touch of event.changedTouches){
                context = contexts.get(touch.identifier)
                this.recognizer.move(touch, context)
            }
        })
        
        element.addEventListener('touchend', (event) => {
            for (let touch of event.changedTouches){
                context = contexts.get(touch.identifier)
                this.recognizer.end(touch, context)
                contexts.delete(touch.identifier)
            }
        })
        
        element.addEventListener('touchcancel', (event) => {
            for (let touch of event.changedTouches){
                context = contexts.get(touch.identifier)
                this.recognizer.cancel(touch, context)
                contexts.delete(touch.identifier)
            }
        })
    }
}

class Recognizer{
    constructor(dispather){
        this.dispather = dispather
    }

    start (point, context) {
        context.startX = point.clientX, context.startY = point.clientY
        context.points = [{
            t: Date.now(),
            x: point.clientX,
            y: point.clientY
        }]
    
    
        context.isTap = true
        context.isPan = false
        context.isPress = false
    
        context.timer = setTimeout(() => {
            context.isTap = false
            context.isPan = false
            context.isPress = true
            context.timer = null
        }, 500)
    }
    move (point, context) {
        let dx = context.startX - point.clientX, dy = context.startY - point.clientY
        if (dx ** 2 + dy ** 2 > 100){
            context.isTap = false
            context.isPan = true
            context.isPress = false
            context.points = context.points.filter((item) => Date.now() - item.t < 500)
            context.points.push({
                t: Date.now(),
                x: point.clientX,
                y: point.clientY
            })
            context.vertical = Math.abs(dy) - Math.abs(dx)
            this.dispather.dispath('panStart', {
                startX: context.startX,
                startY: context.startY,
                clientX: point.clientX,
                clientY: point.clientY,
                vertical: context.vertical
            })
            clearTimeout(context.timer)
        }
    }

    end (point, context) {
        if (context.isTap) {
            this.dispather.dispath('tap', {})
            clearTimeout(context.timer)
        }
        if (context.isPan) {
            let t, v
            context.points = context.points.filter((item) => Date.now() - item.t < 500)
            if (context.points.length === 0) {
                v = 0
            } else {
                t = Math.sqrt((point.clientX - context.points[0].x) ** 2 + (point.clientY - context.points[0].y) ** 2)
                v = t /(Date.now() - context.points[0].t)
            }
            if (v > 1.5){
                this.dispather.dispath('flick', {
                    startX: context.startX,
                    startY: context.startY,
                    clientX: point.clientX,
                    clientY: point.clientY,
                    v,
                })
            }
            this.dispather.dispath('panEnd', {
                startX: context.startX,
                startY: context.startY,
                clientX: point.clientX,
                clientY: point.clientY,
            })
        }
        if (context.isPress) {
            this.dispather.dispath('press', {})
        }
    }

    cancel (point, context) {
        this.dispather.dispath('cancel', {})
        clearTimeout(context.timer)
    }
}

export function enableGuesture(element) {
    new Lisenter(element, new Recognizer(new Dispather(element)))
}

enableGuesture(document.documentElement)