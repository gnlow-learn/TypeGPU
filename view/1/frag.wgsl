@fragment
fn main(
    @location(0) uv: vec2f,
) -> @location(0) vec4f {
    let red = floor(uv.x * f32(span.x)) / f32(span.x);
    let green = floor(uv.y * f32(span.y)) / f32(span.y);
    return vec4(red, green, blue, 1.0);
}
