import tgpu, { TgpuRoot } from "https://esm.sh/typegpu@0.3.2"

type AnyData = Parameters<TgpuRoot["createBuffer"]>[0]

interface GpuWrapperInfo {
    $canvas: HTMLCanvasElement,
    vertShader: string,
    fragShader: string,
    uniforms?: AnyData[],
}

export class GpuWrapper {
    root
    ctx
    format = navigator.gpu.getPreferredCanvasFormat()
    pipeline
    uniforms
    bindGroup

    constructor(
        root: TgpuRoot,
        {
            $canvas,
            vertShader,
            fragShader,
            uniforms,
        }: GpuWrapperInfo,
    ) {
        this.root = root
        this.ctx = $canvas.getContext("webgpu") as unknown as GPUCanvasContext

        const device = this.root.device
        const format = this.format
        
        this.ctx.configure({
            device,
            format,
            alphaMode: "premultiplied",
        })

        this.pipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: device.createShaderModule({
                    code: vertShader,
                }),
            },
            fragment: {
                module: device.createShaderModule({
                    code: fragShader,
                }),
                targets: [{ format }],
            },
            primitive: {
                topology: "triangle-strip",
            }
        })

        this.uniforms = uniforms?.map(uniform =>
            this.root.createBuffer(uniform).$usage("uniform")
        ) || []

        this.bindGroup = device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                ...this.uniforms.map((uniform, i) => ({
                    binding: i,
                    resource: {
                        buffer: uniform.buffer,
                    }
                })),
            ]
        })
    }
    draw() {
        const textureView = this.ctx.getCurrentTexture().createView()
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

        const commandEncoder = this.root.device.createCommandEncoder()
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
        passEncoder.setPipeline(this.pipeline)
        passEncoder.setBindGroup(0, this.bindGroup)
        passEncoder.draw(4)
        passEncoder.end()

        this.root.device.queue.submit([commandEncoder.finish()])
    }
    
    static async init(info: GpuWrapperInfo) {
        return new GpuWrapper(
            await tgpu.init(),
            info,
        )
    }
}
