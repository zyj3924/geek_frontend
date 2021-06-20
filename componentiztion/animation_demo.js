import {TimeLine, Animation} from './animation'


const element = document.querySelector('#demo')
const element2 = document.querySelector('#demo2')

const start = document.querySelector('#start')
const pause = document.querySelector('#pause')
const resume = document.querySelector('#resume')

let tl = new TimeLine()
tl.add(new Animation(element, 'style', 0, 600 , 4000, 0, null, (x) => `transform:translateX(${x}px)`))
tl.add(new Animation(element2, 'style', 0, 200 , 2000, 0, null, (x) => `transform:translateX(${x}px)`))

start.addEventListener('click', () => tl.start())
pause.addEventListener('click', () => tl.pause())
resume.addEventListener('click', () => tl.resume())
