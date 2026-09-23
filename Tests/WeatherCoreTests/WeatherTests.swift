import XCTest
@testable import WeatherCore
final class WeatherTests:XCTestCase {
 func testMissingValuesAndConversions(){XCTAssertNil(Display.number(NSNull()));XCTAssertNil(Display.number(true));XCTAssertEqual(Display.temperature(0,unit:"F"),"32");XCTAssertEqual(Display.temperature(nil,unit:"F"),"—");XCTAssertEqual(Display.wave(1,unit:"F"),"3.3");XCTAssertEqual(Display.wind(16.09344,unit:"F"),"10");XCTAssertEqual(Display.rain(25.4,unit:"F"),"1.00")}
 func testPlaceBounds(){var p=Place.presets[0];XCTAssertTrue(p.valid);p.lat=91;XCTAssertFalse(p.valid);p.lat=21;p.timezone="invalid/zone";XCTAssertFalse(p.valid)}
 func testTimezoneAndWeatherCode(){let t=ISO8601DateFormatter().date(from:"2026-09-14T01:00:00Z")!.timeIntervalSince1970;XCTAssertEqual(Display.time(t,zone:"Pacific/Honolulu",format:"HH:mm"),"15:00");XCTAssertEqual(Display.condition(nil),"Conditions unavailable");XCTAssertEqual(Display.condition(99),"Thunderstorms");XCTAssertEqual(Display.condition(1000),"Conditions unavailable")}
 func testMarineCellDistance(){let p=Place.presets[0];XCTAssertEqual(Display.distance(p,lat:p.lat,lon:p.lon),0,accuracy:0.001);XCTAssertGreaterThan(Display.distance(p,lat:47.6,lon:-122.3),4000)}
}
