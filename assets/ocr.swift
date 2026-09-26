import AppKit
import Darwin
import Foundation
import Vision

enum ExitCode: Int32 {
  case ok = 0
  case failure = 1
  case cancelled = 2
  case empty = 3
}

do {
  try run()
} catch {
  fail(error.localizedDescription, code: .failure)
}

func run() throws {
  let arguments = CommandLine.arguments
  guard arguments.count >= 2, arguments[1] == "capture" else {
    fail("用法: ocr-tool capture", code: .failure)
  }

  let path = NSTemporaryDirectory() + UUID().uuidString + ".png"
  defer { try? FileManager.default.removeItem(atPath: path) }

  let task = Process()
  task.executableURL = URL(fileURLWithPath: "/usr/sbin/screencapture")
  task.arguments = ["-i", "-x", path]
  try task.run()
  task.waitUntilExit()

  guard task.terminationStatus == 0, FileManager.default.fileExists(atPath: path) else {
    exit(ExitCode.cancelled.rawValue)
  }

  guard let image = NSImage(contentsOfFile: path) else {
    fail("无法读取截图。", code: .failure)
  }
  var rect = NSRect.zero
  guard let cgImage = image.cgImage(forProposedRect: &rect, context: nil, hints: nil) else {
    fail("无法读取截图。", code: .failure)
  }

  let request = VNRecognizeTextRequest()
  request.recognitionLevel = .accurate
  request.usesLanguageCorrection = true

  let observations = try silencingStdout {
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])
    return request.results ?? []
  }

  let lines = observations.compactMap { observation -> (String, CGRect)? in
    guard let text = observation.topCandidates(1).first?.string, !text.isEmpty else { return nil }
    return (text, observation.boundingBox)
  }
  .sorted { lhs, rhs in
    if abs(lhs.1.midY - rhs.1.midY) > 0.015 {
      return lhs.1.midY > rhs.1.midY
    }
    return lhs.1.minX < rhs.1.minX
  }
  .map(\.0)

  if lines.isEmpty {
    exit(ExitCode.empty.rawValue)
  }
  print(lines.joined(separator: "\n"))
}

func silencingStdout<T>(_ body: () throws -> T) rethrows -> T {
  fflush(stdout)
  let original = dup(1)
  let devNull = open("/dev/null", O_WRONLY)
  dup2(devNull, 1)
  close(devNull)
  defer {
    fflush(stdout)
    dup2(original, 1)
    close(original)
  }
  return try body()
}

func fail(_ message: String, code: ExitCode) -> Never {
  fputs(message + "\n", stderr)
  exit(code.rawValue)
}
