import XCTest
@testable import WeatherCore
final class PreferencesTests: XCTestCase {
    func testOldSettingsKeepLocationUnitsAndManualMode() throws {
        let legacy:[String:Any] = ["place":try JSONSerialization.jsonObject(with:JSONEncoder().encode(Place.presets[1])),"unit":"C","automatic":false]
        let restored=try JSONDecoder().decode(Preferences.self,from:JSONSerialization.data(withJSONObject:legacy))
        XCTAssertEqual(restored.place,Place.presets[1]);XCTAssertEqual(restored.unit,"C");XCTAssertFalse(restored.automatic)
        XCTAssertEqual(restored.mapProvider,.earth)
    }
    func testProviderPersistsAndUnknownProviderFallsBackWithoutResettingLocation() throws {
        var settings=Preferences();settings.mapProvider = .windy;settings.place=Place.presets[2]
        let data=try JSONEncoder().encode(settings)
        XCTAssertEqual(try JSONDecoder().decode(Preferences.self,from:data).mapProvider,.windy)
        let future=String(decoding:data,as:UTF8.self).replacingOccurrences(of:"\"windy\"",with:"\"future-provider\"")
        let restored=try JSONDecoder().decode(Preferences.self,from:Data(future.utf8))
        XCTAssertEqual(restored.mapProvider,.earth);XCTAssertEqual(restored.place,settings.place)
    }
}
