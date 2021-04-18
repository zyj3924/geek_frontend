
function match(string){
    let status = start
    for (str of string) {
        status = status(str)
    }
    return status === end
}

function start(str) {
    if (str === 'a') {
        return foundA
    } else {
        return start
    }
}

function foundA(str){
    if (str === 'b') {
        return foundB
    } else {
        return start
    }
}

function foundB (str) {
    if (str === 'c'){
        return foundC
    } else {
        return start
    }
}




function foundD(str) {
    if (str === 'e') {
        return foundE
    }else {
        return start
    }
}

function foundE(str) {
    if (str === 'f') {
        return end
    }else {
        return start
    }
}

function foundC (str) {
    if(str === 'd') {
        return foundD
    }else {
        return start
    }
}
function end() {
    return end
}

console.log(match('asdabcefda'))