import { GpuWrapper } from "../../src/util.ts"
import * as d from "https://esm.sh/typegpu@0.3.2/data"

const g = await GpuWrapper.init({
    $canvas: document.querySelector("canvas")!,
    vertShader: await fetch("vert.wgsl").then(x => x.text()),
    fragShader: await fetch("frag.wgsl").then(x => x.text()),
    uniforms: [
        d.struct({
            x: d.u32,
            y: d.u32,
        }),
    ],
})

setTimeout(() => {
    g.uniforms[0].write({ x: 10, y: 20 })
    g.draw()
}, 100)

const tick = () => new Promise(requestAnimationFrame)

while (true) {
    await tick()
    g.uniforms[0].write({
        x: Math.sin(Date.now() / 1000) * 10 + 15,
        y: 20,
    })
    g.draw()
}
