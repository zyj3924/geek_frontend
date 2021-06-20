const TICK = Symbol('tick')
const TICK_HANDLER = Symbol('tick-handler')
const ANIMATIONS = Symbol('animations')
const STARTTIME  = Symbol('start-time')
const PAUSE_START = Symbol('pause-start')
const PAUSE_TIME = Symbol('pause-time')
export class TimeLine {
    constructor () {
        this.state = 'inited'
        this[ANIMATIONS] = new Set()
        this[STARTTIME] = new Map()
        this[PAUSE_TIME] = 0
    }

    start() {
        if (this.state !== 'inited')
            return;
        this.state = 'started'
        let startTime = Date.now()
        this[TICK] = () => {
            let now = Date.now()
            let t;
            for (let animation of this[ANIMATIONS]) {
                if (this[STARTTIME].get(animation) < startTime) {
                    t = now - startTime - this[PAUSE_TIME] - animation.delay
                }else{
                    t = now - this[STARTTIME].get(animation) - this[PAUSE_TIME] - animation.delay
                }
                if (animation.duration < t) {
                    this[ANIMATIONS].delete(animation)
                    t = animation.duration
                }
                
                if (t > 0) {
                    animation.receive(t)
                }
            }
            this[TICK_HANDLER] = requestAnimationFrame(this[TICK])
        }
        this[TICK]()
    }
    
    pause () {
        if (this.state !== 'started')
            return;
        this.state = 'pause'
        this[PAUSE_START] = Date.now()
        cancelAnimationFrame(this[TICK_HANDLER])
    }
    resume () {
        if (this.state !== 'pause')
            return;
        this.state = 'started'
        this[PAUSE_TIME] += Date.now() - this[PAUSE_START]
        this[TICK]()
    }

    reset () {
        this.pause()
        this.state = 'inited'
        this[PAUSE_TIME] = 0
        this[TICK_HANDLER] = null
        this[PAUSE_START] = null
        this[ANIMATIONS] = new Set()
        this[STARTTIME] = new Map()
    }

    add(animation, startTime) {
        if (arguments.length < 2) {
            startTime = Date.now()
        }
        this[ANIMATIONS].add(animation)
        this[STARTTIME].set(animation, startTime)
    }
}

export class Animation {
    constructor(object, property, startValue, endValue, duration, delay, timingFunc, template){
        timingFunc = timingFunc || (v => v)
        template = template || (v => v)
        this.object = object
        this.property = property
        this.startValue = startValue
        this.endValue = endValue
        this.duration = duration
        this.timingFunc = timingFunc
        this.delay = delay
        this.template = template
    }

    receive(time){
        const range = this.endValue - this.startValue
        let tf = this.timingFunc(time / this.duration)
        this.object[this.property] = this.template(this.startValue + range * tf)
    }
}