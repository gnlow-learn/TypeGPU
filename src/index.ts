import tgpu from "https://esm.sh/typegpu@0.3.2"
import * as d from "https://esm.sh/typegpu@0.3.2/data"

const root = await tgpu.init()
const device = root.device

const $canvas = document.querySelector("canvas")!
const ctx = $canvas.getContext("webgpu") as unknown as GPUCanvasContext

const format = navigator.gpu.getPreferredCanvasFormat()

ctx.configure({
    device,
    format,
    alphaMode: "premultiplied",
})

const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
        module: device.createShaderModule({
            code: await fetch("src/vert.wgsl").then(x => x.text()),
        }),
    },
    fragment: {
        module: device.createShaderModule({
            code: await fetch("src/frag.wgsl").then(x => x.text())
        }),
        targets: [{ format }],
    },
    primitive: {
        topology: "triangle-strip",
    }
})

const Span = d.struct({
    x: d.u32,
    y: d.u32,
})

const spanBuffer = root.createBuffer(Span).$usage("uniform")

const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        {
            binding: 0,
            resource: {
                buffer: spanBuffer.buffer,
            }
        }
    ]
})

const draw = (spanX: number, spanY: number) => {
    spanBuffer.write({ x: spanX, y: spanY })
    
    const textureView = ctx.getCurrentTexture().createView()
    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: textureView,
                clearValue: [0, 0, 0, 0],
                loadOp: "clear",
                storeOp: "store",
            }
        ]
    }

    const commandEncoder = device.createCommandEncoder()
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, bindGroup)
    passEncoder.draw(4)
    passEncoder.end()

    device.queue.submit([commandEncoder.finish()])
}

setTimeout(() => {
    draw(10, 10)
}, 100)
