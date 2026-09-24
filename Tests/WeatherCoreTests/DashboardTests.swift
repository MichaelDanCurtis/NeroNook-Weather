import XCTest
@testable import WeatherCore
final class DashboardTests:XCTestCase {
 func testTileProviderPathsCannotBecomeArbitraryNetworkRequests() throws {
  let paths:Set<String>=["/v2/radar/123"]
  let url=try MapTile.url(path:"tiles/radar/123/7/3/4",radarPaths:paths,satelliteTimes:[])
  XCTAssertEqual(url.host,"tilecache.rainviewer.com")
  for path in ["tiles/radar/456/7/3/4","tiles/base/0/13/1/1","tiles/base/0/1/2/0","tiles/base/0/1/-1/0","tiles/infrared/1/7/3/4","tiles/base/../0/0/0","https://example.com/x","tiles/base/0/01/0/0"] {XCTAssertThrowsError(try MapTile.url(path:path,radarPaths:paths,satelliteTimes:[123]))}
  let satellite=try MapTile.url(path:"tiles/infrared/123/0/0/0",radarPaths:[],satelliteTimes:[123]);let parts=URLComponents(url:satellite,resolvingAgainstBaseURL:false)!
  XCTAssertEqual(parts.host,"nowcoast.noaa.gov");XCTAssertTrue(parts.queryItems!.contains{ $0.name=="bbox" && $0.value!.contains("20037508") })
 }
 func testDashboardPreservesGapsAndDiscardsPastHourlyData() throws {
  let now=100000.0
  let feeds:[String:[String:Any]]=["weather":["current":["temperature_2m":NSNull(),"relative_humidity_2m":true],"hourly":["time":[now-7200,now,now+3600],"temperature_2m":[7,NSNull(),10]]],"radar":["radar":["past":[["time":now,"path":"/v2/radar/123"],["time":now,"path":"/evil/../a"]]]]]
  let p=Dashboard.payload(place:Place.presets[0],unit:"C",ready:true,automatic:false,feeds:feeds,errors:["weather":"Stale"],loading:[],message:"",now:now)
  let current=p["current"] as! [String:Any];XCTAssertTrue(current["temperature_2m"] is NSNull);XCTAssertTrue(current["relative_humidity_2m"] is NSNull)
  let hours=p["hourly"] as! [String:[Any]];XCTAssertEqual(hours["time"]?.count,2);XCTAssertTrue(hours["temperature_2m"]![0] is NSNull)
  XCTAssertEqual((p["radar"] as! [[String:Any]]).count,1)
  XCTAssertNoThrow(try JSONSerialization.data(withJSONObject:p))
 }
 func testDashboardBoundsRemoteListsAndText() throws {
  let alert=["event":String(repeating:"a",count:10000),"headline":String(repeating:"b",count:10000)]
  let payload=Dashboard.payload(place:Place.presets[0],unit:"F",ready:true,automatic:false,feeds:["alerts":["alerts":Array(repeating:alert,count:1000)]],errors:[:],loading:[],message:"",now:100000)
  XCTAssertEqual((payload["alerts"] as! [[String:String]]).count,6)
  XCTAssertLessThan(try JSONSerialization.data(withJSONObject:payload).count,28000)
 }
}
