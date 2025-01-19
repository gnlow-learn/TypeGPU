struct Span {
    x: u32,
    y: u32,
}

@group(0) @binding(0) var<uniform> span: Span;

@fragment
fn main(
    @location(0) uv: vec2f,
) -> @location(0) vec4f {
    let red = floor(uv.x * f32(span.x)) / f32(span.x);
    let green = floor(uv.y * f32(span.y)) / f32(span.y);
    return vec4(red, green, 0.5, 1.0);
}
