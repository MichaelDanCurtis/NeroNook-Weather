import Foundation
import NookPluginSDK
import WeatherCore

private final class NoTileRedirects: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping @Sendable (URLRequest?) -> Void) { completionHandler(nil) }
}
actor TileProvider {
    private let session: URLSession
    private var cooldown: [String: Date] = [:]
    init() {
        let config = URLSessionConfiguration.default
        config.urlCache = URLCache(memoryCapacity: 16 * 1024 * 1024, diskCapacity: 96 * 1024 * 1024, directory: (try? PluginStorage.directory(id: moduleID))?.appendingPathComponent("MapCache"))
        config.requestCachePolicy = .useProtocolCachePolicy
        config.timeoutIntervalForRequest = 12; config.timeoutIntervalForResource = 14
        config.httpMaximumConnectionsPerHost = 4
        config.httpAdditionalHeaders = ["User-Agent":"NeroNook-WeatherObservatory/0.2.0 (native macOS plugin)"]
        session = URLSession(configuration: config, delegate: NoTileRedirects(), delegateQueue: nil)
    }
    func load(_ request: PluginViewResourceRequest, radar: Set<String>, satellite: Set<Int>) async throws -> PluginViewResourceResult {
        let url = try MapTile.url(path: request.path, radarPaths: radar, satelliteTimes: satellite)
        guard cooldown[url.host!] ?? .distantPast < Date() else { throw ModuleProblem("Map provider is cooling down. Try later.") }
        let (stream, response) = try await session.bytes(for: URLRequest(url: url))
        guard let http = response as? HTTPURLResponse else { throw ModuleProblem("Map response unavailable.") }
        if http.statusCode == 429 || http.statusCode == 503 {
            let delay = Double(http.value(forHTTPHeaderField: "Retry-After") ?? "") ?? 300
            cooldown[url.host!] = Date().addingTimeInterval(min(21600, max(60, delay)))
        }
        guard http.statusCode == 200, response.expectedContentLength <= 65536,
              let mime = response.mimeType, ["image/png", "image/jpeg", "image/webp"].contains(mime) else { throw ModuleProblem("Map imagery is unavailable from this provider.") }
        var data = Data()
        for try await byte in stream {
            guard data.count < 65536 else { throw ModuleProblem("Map image exceeded its limit.") }
            data.append(byte)
        }
        try Task.checkCancellation()
        let result = PluginViewResourceResult(id: request.id, mime: mime, data: data)
        try result.validate()
        return result
    }
}
