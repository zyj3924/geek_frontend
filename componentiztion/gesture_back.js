const element = document.documentElement
let contexts = new Map()
let isListening = false


element.addEventListener('mousedown', (event) => {
    let context = Object.create(null)
    console.log('mousedown', event.button << 1)
    contexts.set('mouse'+(1 << event.button), context)
    start(event, context)

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
                move(event, context)
            }
            button = button << 1
        }
        
    }

    let up = (event) => {
        context = contexts.get('mouse'+(1 << event.button))
        end(event, context)
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
        start(touch, context)
    }
})

element.addEventListener('touchmove', (event) => {
    for (let touch of event.changedTouches){
        context = contexts.get(touch.identifier)
        move(touch, context)
    }
})

element.addEventListener('touchend', (event) => {
    for (let touch of event.changedTouches){
        context = contexts.get(touch.identifier)
        end(touch, context)
        contexts.delete(touch.identifier)
        console.log('contexts', contexts)
    }
})

element.addEventListener('touchcancel', (event) => {
    for (let touch of event.changedTouches){
        context = contexts.get(touch.identifier)
        cancel(touch, context)
        contexts.delete(touch.identifier)
        console.log('contexts', contexts)
    }
})


let start = (point, context) => {
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
let move = (point, context) => {
    let dx = context.startX - point.clientX, dy = context.startY - point.clientY
    if (dx ** 2 + dy ** 2 > 100){
        context.isTap = false
        context.isPan = true
        context.isPress = false
        console.log('isPan')
        context.points = context.points.filter((item) => Date.now() - item.t < 500)
        context.points.push({
            t: Date.now(),
            x: point.clientX,
            y: point.clientY
        })
        clearTimeout(context.timer)
    }
}
let end = (point, context) => {
    if (context.isTap) {
        console.log('istap')
        dispath('tap', {})
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
            console.log('flick')
        }
        console.log('ispan', v)
    }
    if (context.isPress) {
        console.log('Pressend')
    }
}

let cancel = (point, context) => {
    clearTimeout(context.timer)
}

function dispath(type ,properties){
    let event = new Event(type);
    for (let name in properties){
        event[name] = properties[name]
    }
    console.log(event)
    element.dispatchEvent(event)
}