import AppKit
import Foundation

let output = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "assets/icon.png"
let pixels = 512

guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: pixels,
    pixelsHigh: pixels,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
) else {
    fputs("无法创建画布\n", stderr)
    exit(1)
}

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
let canvas = NSRect(x: 0, y: 0, width: pixels, height: pixels)
NSColor.clear.setFill()
canvas.fill()

let background = NSBezierPath(roundedRect: canvas, xRadius: 112, yRadius: 112)
NSColor(srgbRed: 0.043, green: 0.357, blue: 0.325, alpha: 1).setFill()
background.fill()

let bar = NSBezierPath(roundedRect: NSRect(x: 104, y: 96, width: 304, height: 24), xRadius: 12, yRadius: 12)
NSColor(srgbRed: 0.969, green: 0.745, blue: 0.290, alpha: 1).setFill()
bar.fill()

let style = NSMutableParagraphStyle()
style.alignment = .center
let attributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 256, weight: .semibold),
    .foregroundColor: NSColor.white,
    .paragraphStyle: style,
]
let text = "译" as NSString
let textSize = text.size(withAttributes: attributes)
let textRect = NSRect(x: 0, y: (CGFloat(pixels) - textSize.height) / 2 + 16, width: CGFloat(pixels), height: textSize.height)
text.draw(in: textRect, withAttributes: attributes)
NSGraphicsContext.restoreGraphicsState()

guard let png = rep.representation(using: .png, properties: [:]) else {
    fputs("无法编码 PNG\n", stderr)
    exit(1)
}
try png.write(to: URL(fileURLWithPath: output))
