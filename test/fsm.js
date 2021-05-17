const m = new Map()
const f = function(){}
m.set(1212, '121233')
m.set(f,'is a function')
console.log(m.get(f))
for(let key of m){
    console.log(key)
}

const  o = {}
o['name'] = 'zyj'