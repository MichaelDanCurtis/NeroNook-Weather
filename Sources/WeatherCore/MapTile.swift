import Foundation

/// Resolve symbolic map resources only against published frames and fixed providers.
public enum MapTile {
    public static func url(path: String, radarPaths: Set<String>, satelliteTimes: Set<Int>) throws -> URL {
        let parts = path.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
        guard parts.count == 6, parts[0] == "tiles", parts[2].utf8.count <= 80,
              parts[3...5].allSatisfy({ $0.range(of: #"^(0|[1-9][0-9]{0,5})$"#, options: .regularExpression) != nil }),
              let z = Int(parts[3]), let x = Int(parts[4]), let y = Int(parts[5]),
              (0...12).contains(z), (0..<(1 << z)).contains(x), (0..<(1 << z)).contains(y) else { throw MapTileError.invalid }
        switch parts[1] {
        case "base":
            guard parts[2] == "0" else { throw MapTileError.invalid }
            return URL(string: "https://tile.openstreetmap.org/\(z)/\(x)/\(y).png")!
        case "radar", "coverage":
            guard z <= 7 else { throw MapTileError.invalid }
            if parts[1] == "coverage" {
                guard parts[2] == "0" else { throw MapTileError.invalid }
                return URL(string: "https://tilecache.rainviewer.com/v2/coverage/0/256/\(z)/\(x)/\(y)/0/0_0.png")!
            }
            let path = "/v2/radar/" + parts[2]
            guard parts[2].range(of: #"^[A-Za-z0-9_-]+$"#, options: .regularExpression) != nil, radarPaths.contains(path) else { throw MapTileError.invalid }
            return URL(string: "https://tilecache.rainviewer.com\(path)/256/\(z)/\(x)/\(y)/2/1_1.png")!
        case "infrared":
            guard let time = Int(parts[2]), satelliteTimes.contains(time) else { throw MapTileError.invalid }
            let span = 40075016.68557849 / Double(1 << z), half = 20037508.342789244
            let left = Double(x) * span - half, top = half - Double(y) * span
            let iso = ISO8601DateFormatter().string(from: Date(timeIntervalSince1970: Double(time)))
            var url = URLComponents(string: "https://nowcoast.noaa.gov/geoserver/observations/satellite/wms")!
            url.queryItems = ["service":"WMS", "version":"1.1.1", "request":"GetMap", "layers":"global_longwave_imagery_mosaic", "styles":"", "format":"image/png", "transparent":"true", "srs":"EPSG:3857", "width":"256", "height":"256", "time":iso, "bbox":"\(left),\(top-span),\(left+span),\(top)"].sorted { $0.key < $1.key }.map { URLQueryItem(name:$0.key,value:$0.value) }
            return url.url!
        default: throw MapTileError.invalid
        }
    }
}
public enum MapTileError: Error { case invalid }
