import Foundation
@MainActor final class WeatherWorker {
 private var process:Process?; private var output:Pipe?; private var input:Pipe?; private let reader=LineReader()
 var onReply:(([String:Any])->Void)?;var onExit:(()->Void)?
 func start() throws {
  if process?.isRunning == true {return}
  let bundle=Bundle.main, p=Process(), pin=Pipe(), pout=Pipe()
  guard let root=bundle.resourceURL else {throw CocoaError(.fileNoSuchFile)}
  p.executableURL=bundle.bundleURL.appendingPathComponent("Contents/Helpers/weather-node");p.arguments=[root.appendingPathComponent("worker.mjs").path]
  p.environment=["HOME":NSHomeDirectory(),"TMPDIR":NSTemporaryDirectory(),"PATH":"/usr/bin:/bin"]
  p.standardInput=pin;p.standardOutput=pout;p.standardError=FileHandle.nullDevice
  pout.fileHandleForReading.readabilityHandler={ [weak self] file in let data=file.availableData; Task{@MainActor in self?.consume(data)} }
  p.terminationHandler={ [weak self] _ in Task{@MainActor in self?.onExit?()} }
  try p.run();process=p;input=pin;output=pout
 }
 private func consume(_ data:Data){ for line in reader.append(data) {if let object=(try? JSONSerialization.jsonObject(with:line)) as? [String:Any]{onReply?(object)}} }
 func send(_ object:[String:Any]) throws {try start();let data=try JSONSerialization.data(withJSONObject:object)+Data([10]);try input?.fileHandleForWriting.write(contentsOf:data)}
 func stop(){output?.fileHandleForReading.readabilityHandler=nil;try? input?.fileHandleForWriting.close();process?.terminate();process=nil}
}
final class LineReader: @unchecked Sendable {
 private var buffer=Data()
 func append(_ data:Data)->[Data]{buffer.append(data);if buffer.count>12_000_000{buffer.removeAll();return []};var result:[Data]=[];while let end=buffer.firstIndex(of:10){result.append(buffer.subdata(in:buffer.startIndex..<end));buffer.removeSubrange(buffer.startIndex...end)};return result}
}
