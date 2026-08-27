var canvas = document.querySelector("canvas")
canvas.width = innerWidth
canvas.height = innerHeight
var c = canvas.getContext("2d")

var g = 500
var dragged_point

var hand_tool = false

var mouse = {x: 0, y: 0}

var colors = [
    "#E58F8F",
    "#E8A56F",
    "#E3C766",
    "#A8C96B",
    "#68B99A",
    "#6FA8D4",
    "#818BD2",
    "#A67CCB",
    "#D07FA8",
    "#C49676"
]

var camera = {x: 0, y: 0}
var camera0 = {x: 0, y: 0}

class Point{
    constructor(x, y, color) {
        this.pos = {x: x, y: y}
        this.pos0 = {x: x, y: y}
        this.vel = {x: 0, y: 0}
        this.acc = {x: 0, y: 0}
        this.movable = 1
        this.color = color
    }
    draw() {
        c.beginPath()
        c.arc(this.pos.x, this.pos.y, 5, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.fillStyle = "rgba(0, 0, 0, 0.5)"
        c.fill()
    }
    update(dt) {
        if (this.movable == 0 || dragged_point == this) {
            return
        }
        this.acc.y += g
        this.vel.x = this.pos.x - this.pos0.x
        this.vel.y = this.pos.y - this.pos0.y
        this.pos0.x = this.pos.x
        this.pos0.y = this.pos.y
        this.pos.x += this.vel.x + this.acc.x * dt * dt
        this.pos.y += this.vel.y + this.acc.y * dt * dt
        this.acc = {x: 0, y: 0}
    }
}
class Constrain{
    constructor(p1, p2, color) {
        this.p1 = p1
        this.p2 = p2
        this.length = Math.hypot(p1.pos.x - p2.pos.x, p1.pos.y - p2.pos.y)
        this.color = color
    }
    draw() {
        c.beginPath()
        c.moveTo(this.p1.pos.x, this.p1.pos.y)
        c.lineTo(this.p2.pos.x, this.p2.pos.y)
        c.strokeStyle = this.color
        c.lineWidth = 20
        c.lineCap = "round"
        c.stroke()
    }
    fix() {
        var vect = {x: this.p1.pos.x - this.p2.pos.x, y: this.p1.pos.y - this.p2.pos.y}
        var dist = Math.hypot(vect.x, vect.y)

        if (dist !== this.length && dist !== 0) {
            var x = this.length - dist
            var norm = {x: vect.x / dist, y: vect.y / dist}
            var total_movability = this.p1.movable + this.p2.movable
            this.p1.pos.x += norm.x * x * (this.p1.movable / total_movability)
            this.p1.pos.y += norm.y * x * (this.p1.movable / total_movability)
            this.p2.pos.x -= norm.x * x * (this.p2.movable / total_movability)
            this.p2.pos.y -= norm.y * x * (this.p2.movable / total_movability)
        }
    }
}
class Pendulum{
    constructor(count, l) {
        this.count = count
        this.length = l
        this.points = []
        this.constrains = []
        for (var i = 0; i < this.count + 1; i++) {
            var color = colors[Math.floor(Math.random() * colors.length)]
            while (this.points.at(-1) && color == this.points.at(-1).color) {
                color = colors[Math.floor(Math.random() * colors.length)]
            }
            this.points.push(new Point(canvas.width / 2, canvas.height / 2 + i * this.length, color))
        }
        this.points[0].movable = 0
        for (var i = 0; i < this.count; i++) {
            this.constrains.push(new Constrain(this.points[i], this.points[i + 1], this.points[i].color))
        }
    }
    changeCount() {
        var count = document.querySelector("#count").value
        this.count = Number(count)
        while (this.points.length < this.count + 1) {
            var color = colors[Math.floor(Math.random() * colors.length)]
            var pre_color = this.points.at(-1).color || color
            while (this.points.at(-1) && color == this.points.at(-1).color) {
                color = colors[Math.floor(Math.random() * colors.length)]
            }
            var x = this.points.at(-1).pos.x
            var y = this.points.at(-1).pos.y
            this.points.push(new Point(x, y + this.length, color))
            this.constrains.push(new Constrain(this.points.at(-2), this.points.at(-1), pre_color))
        }
        while (this.points.length > this.count + 1) {
            this.points.pop()
            this.constrains.pop()
        }
    }
    draw() {
        this.constrains.forEach(constrain => {
            constrain.draw()
        })
        this.points.forEach(point => {
            point.draw()
        })
    }
    update(dt) {
        this.points.forEach(point => {
            point.update(dt)
        })
        for (var i = 0; i < 10; i++) {
            this.constrains.forEach(constrain => {
                constrain.fix()
            })
        }

    }
}

var pendulum = new Pendulum(2, 100)

window.addEventListener("mousedown", (e) => {
    if (e.button == 2) {
        hand_tool = true
        camera0.x = e.clientX
        camera0.y = e.clientY
        return
    }
    pendulum.points.forEach(point => {
        var dist = Math.hypot(point.pos.x - e.clientX + camera.x, point.pos.y - e.clientY + camera.y)
        if (dist < 10) {
            dragged_point = point
        }
    })
})

window.addEventListener("mousemove", (e) => {
    if (hand_tool) {
        camera.x += e.clientX - camera0.x
        camera.y += e.clientY - camera0.y
        camera0.x = e.clientX
        camera0.y = e.clientY
    }
    else if (dragged_point) {
        mouse = {x: e.clientX, y: e.clientY}
        dragged_point.pos.x = mouse.x - camera.x
        dragged_point.pos.y = mouse.y - camera.y
        pendulum.constrains.forEach(constrain => {
            constrain.fix()
        })
    }
    
})

window.addEventListener("mouseup", () => {
    hand_tool = false
    dragged_point = null
})

window.addEventListener("contextmenu", (e) => {
    e.preventDefault()
})

document.querySelector("#count").addEventListener("input", () => {
    pendulum.changeCount()
})

document.querySelector("#gravity").addEventListener("input", () => {
    g = document.querySelector("#gravity").value
})

document.querySelector("#length").addEventListener("input", () => {
    pendulum.length = Number(document.querySelector("#length").value)
    pendulum.constrains.forEach(constrain => {
        constrain.length = document.querySelector("#length").value
    })
})

var t0 = 0
var targetdt = 1/60
var accumulator = 0

function animate(t) {
    var dt = (t - t0) / 1000
    if (isNaN(dt) || dt > 0.1) {
        dt = 0
    }
    t0 = t
    accumulator += dt
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    c.save()
    c.translate(camera.x, camera.y)
    while (accumulator > targetdt) {
        pendulum.update(dt)
        accumulator -= targetdt
    }
    pendulum.draw()
    c.restore()
    if (dragged_point) {
        dragged_point.pos.x = mouse.x - camera.x
        dragged_point.pos.y = mouse.y - camera.y
        pendulum.constrains.forEach(constrain => {
            constrain.fix()
        })
    }
}
animate()