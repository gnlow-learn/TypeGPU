import tgpu, { TgpuRoot, TgpuBuffer } from "https://esm.sh/typegpu@0.3.2"

type AnyData = Parameters<TgpuRoot["createBuffer"]>[0]
type Layout = Parameters<typeof tgpu.bindGroupLayout>[0]

interface GpuWrapperInfo {
    $canvas: HTMLCanvasElement,
    vertShader: string,
    fragShader: string,
    layout?: Layout,
}

export class GpuWrapper {
    root
    ctx
    format = navigator.gpu.getPreferredCanvasFormat()
    pipeline
    bindGroup
    buffers

    constructor(
        root: TgpuRoot,
        {
            $canvas,
            vertShader,
            fragShader,
            layout,
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

        this.buffers = {} as Record<string, TgpuBuffer<AnyData>>
        Object.entries(layout || {})
            .forEach(([k, v]) => {
                if ("uniform" in v!) {
                    this.buffers[k] =
                        root.createBuffer(v.uniform)
                            .$usage("uniform")
                }
            })

        const bgLayout = tgpu.bindGroupLayout(layout || {})
        this.bindGroup = root.createBindGroup(
            bgLayout,
            this.buffers,
        )

        this.pipeline = device.createRenderPipeline({
            layout: device.createPipelineLayout({
                bindGroupLayouts: [root.unwrap(bgLayout)]
            }),
            vertex: {
                module: device.createShaderModule({
                    code: tgpu.resolve({
                        template: vertShader,
                        externals: {
                            ...bgLayout.bound,
                        },
                    }),
                }),
            },
            fragment: {
                module: device.createShaderModule({
                    code: tgpu.resolve({
                        template: fragShader,
                        externals: {
                            ...bgLayout.bound,
                        },
                    }),
                }),
                targets: [{ format }],
            },
            primitive: {
                topology: "triangle-strip",
            }
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
        passEncoder.setBindGroup(0, this.root.unwrap(this.bindGroup))
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
