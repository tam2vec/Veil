import Foundation
import AVFoundation
import AppKit

let width = 1280
let height = 720
let fps: Int32 = 30
let frames = Int(fps) * 7
let url = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
    .appendingPathComponent("assets/veil-demo-test-recording.mp4")
try? FileManager.default.removeItem(at: url)

let writer = try AVAssetWriter(outputURL: url, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height
])
input.expectsMediaDataInRealTime = false
let adapter = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

func color(_ hex: UInt32) -> NSColor {
    NSColor(red: CGFloat((hex >> 16) & 0xff) / 255, green: CGFloat((hex >> 8) & 0xff) / 255, blue: CGFloat(hex & 0xff) / 255, alpha: 1)
}
func rect(_ ctx: CGContext, _ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ fill: NSColor, radius: CGFloat = 0) {
    ctx.setFillColor(fill.cgColor)
    if radius > 0 { ctx.addPath(CGPath(roundedRect: CGRect(x: x, y: y, width: w, height: h), cornerWidth: radius, cornerHeight: radius, transform: nil)); ctx.fillPath() }
    else { ctx.fill(CGRect(x: x, y: y, width: w, height: h)) }
}
func text(_ string: String, _ x: CGFloat, _ y: CGFloat, _ size: CGFloat = 17, _ shade: NSColor = color(0x1f2937), bold: Bool = false) {
    let font = bold ? NSFont.systemFont(ofSize: size, weight: .semibold) : NSFont.systemFont(ofSize: size)
    let attr: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: shade]
    NSString(string: string).draw(at: CGPoint(x: x, y: y), withAttributes: attr)
}
func cursor(_ ctx: CGContext, _ x: CGFloat, _ y: CGFloat, click: Bool = false) {
    ctx.setFillColor(NSColor.white.cgColor); ctx.setStrokeColor(color(0x263142).cgColor); ctx.setLineWidth(3)
    let p = CGMutablePath(); p.move(to: CGPoint(x: x, y: y)); p.addLine(to: CGPoint(x: x + 8, y: y + 33)); p.addLine(to: CGPoint(x: x + 17, y: y + 23)); p.addLine(to: CGPoint(x: x + 27, y: y + 43)); p.addLine(to: CGPoint(x: x + 35, y: y + 39)); p.addLine(to: CGPoint(x: x + 24, y: y + 20)); p.addLine(to: CGPoint(x: x + 38, y: y + 19)); p.closeSubpath(); ctx.addPath(p); ctx.drawPath(using: .fillStroke)
    if click { ctx.setStrokeColor(color(0x51a474).cgColor); ctx.setLineWidth(3); ctx.strokeEllipse(in: CGRect(x: x - 16, y: y - 16, width: 54, height: 54)) }
}
func common(_ ctx: CGContext, title: String, address: String) {
    rect(ctx, 0, 0, CGFloat(width), CGFloat(height), color(0xe9eff2))
    rect(ctx, 80, 55, 1120, 610, color(0xffffff), radius: 14)
    rect(ctx, 80, 55, 1120, 54, color(0xf0f3f5), radius: 14)
    for i in 0..<3 { rect(ctx, 104 + CGFloat(i * 15), 77, 9, 9, i == 0 ? color(0xf08d83) : color(0xc6cbd0), radius: 5) }
    rect(ctx, 188, 69, 650, 25, color(0xffffff), radius: 7); text(address, 204, 75, 11, color(0x77818d))
    rect(ctx, 80, 109, 175, 556, color(0x202b38))
    text("NORTHSTAR", 105, 140, 15, color(0xf1f5f7), bold: true)
    for (i, label) in ["Overview", "Customers", "Developer", "Settings"].enumerated() { text(label, 113, 200 + CGFloat(i * 48), 14, i == 0 ? color(0xb8e3c8) : color(0xb1bdc7)) }
    text(title, 290, 150, 26, color(0x202936), bold: true)
}
func drawFrame(_ ctx: CGContext, time: Double) {
    if time < 1.7 {
        common(ctx, title: "Project overview", address: "app.northstar.test/projects")
        text("Q3 Product Demo", 290, 210, 18, color(0x273340), bold: true)
        for i in 0..<3 { rect(ctx, 290 + CGFloat(i * 255), 260, 220, 115, color(0xf7f9fa), radius: 10); text(["Active projects", "Team members", "Demo readiness"][i], 310 + CGFloat(i * 255), 286, 13, color(0x75808b)); text(["12", "28", "Ready"][i], 310 + CGFloat(i * 255), 320, 25, color(0x25313e), bold: true) }
        text("Nothing sensitive is visible here.", 290, 440, 15, color(0x64717e))
        cursor(ctx, 525 + CGFloat(time * 80), 245)
    } else if time < 4.1 {
        common(ctx, title: "Developer settings", address: "app.northstar.test/settings/developer")
        rect(ctx, 290, 205, 820, 260, color(0x202a36), radius: 9)
        text("$ northstar config show", 315, 235, 15, color(0xe6eef2))
        text("environment = production", 315, 270, 15, color(0xbdd1c4))
        text("STRIPE_TEST_KEY =", 315, 307, 15, color(0xe6eef2))
        rect(ctx, 480, 298, 335, 30, color(0xf7d1cc), radius: 4)
        text("sk_test_51FAKE_DEMO_ONLY", 490, 306, 15, color(0x8d3027), bold: true)
        text("NOTE: This is intentionally fake test data.", 315, 360, 13, color(0xffc17c))
        text("Veil should flag the key at this moment.", 290, 510, 15, color(0x64717e))
        cursor(ctx, 680, 302, click: time > 2.4 && time < 2.9)
    } else if time < 5.7 {
        common(ctx, title: "Customer workspace", address: "app.northstar.test/customers/1048")
        rect(ctx, 290, 210, 820, 160, color(0xf8fafb), radius: 9)
        rect(ctx, 320, 244, 72, 72, color(0xddebe3), radius: 36)
        text("AM", 340, 267, 17, color(0x3d7458), bold: true)
        text("Amara Iqbal", 420, 242, 23, color(0x26313d), bold: true)
        text("amara.iqbal@example.test", 420, 280, 15, color(0xb26931), bold: true)
        text("Northwind Health · Enterprise account", 420, 311, 14, color(0x67727f))
        text("Veil should flag this customer contact information.", 290, 430, 15, color(0x64717e))
        cursor(ctx, 490, 282)
    } else {
        common(ctx, title: "Team messages", address: "chat.northstar.test/direct/launch")
        rect(ctx, 290, 205, 820, 300, color(0xf8fafb), radius: 9)
        text("Product launch", 315, 235, 16, color(0x3d4753), bold: true)
        text("Nina · 10:26 AM", 325, 285, 13, color(0x6b7682), bold: true)
        rect(ctx, 315, 305, 650, 68, color(0xfff0ef), radius: 7)
        text("Please do not show the customer name in the recording yet.", 333, 326, 15, color(0x813c35))
        text("Legal approval is still pending.", 333, 350, 15, color(0x813c35))
        text("Veil should flag this private internal conversation.", 290, 550, 15, color(0x64717e))
        cursor(ctx, 720, 338)
    }
}

for frame in 0..<frames {
    while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
    var buffer: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, adapter.pixelBufferPool!, &buffer)
    guard let pixelBuffer = buffer else { fatalError("Could not create pixel buffer") }
    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    let context = CGContext(data: CVPixelBufferGetBaseAddress(pixelBuffer), width: width, height: height, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
    context.translateBy(x: 0, y: CGFloat(height)); context.scaleBy(x: 1, y: -1)
    NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: true)
    drawFrame(context, time: Double(frame) / Double(fps))
    NSGraphicsContext.restoreGraphicsState()
    CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
    adapter.append(pixelBuffer, withPresentationTime: CMTime(value: CMTimeValue(frame), timescale: fps))
}
input.markAsFinished()
writer.finishWriting { print("Created \(url.path)") }
RunLoop.current.run(until: Date(timeIntervalSinceNow: 3))
