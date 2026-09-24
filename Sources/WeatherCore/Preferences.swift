import Foundation

public enum MapProvider: String, Codable, CaseIterable, Sendable {
    case earth, windy
    public var title: String { self == .earth ? "Earth · no account" : "Windy · your account" }
}

public struct Preferences: Codable {
    public var place = Place.presets[0]
    public var unit = "F"
    public var automatic = true
    public var mapProvider = MapProvider.earth
    public init() {}
    private enum CodingKeys: String, CodingKey { case place, unit, automatic, mapProvider }
    public init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        place = try values.decode(Place.self, forKey: .place)
        unit = try values.decode(String.self, forKey: .unit)
        automatic = try values.decode(Bool.self, forKey: .automatic)
        // Preserve location and units when upgrading an older preferences file.
        mapProvider = MapProvider(rawValue: try values.decodeIfPresent(String.self, forKey: .mapProvider) ?? "") ?? .earth
    }
}
