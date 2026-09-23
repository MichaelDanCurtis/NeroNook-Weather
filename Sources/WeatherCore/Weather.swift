import Foundation
public struct Place: Codable, Equatable, Identifiable, Sendable {
 public var name: String; public var region: String; public var country: String; public var countryCode: String; public var lat: Double; public var lon: Double; public var timezone: String
 public init(name:String,region:String,country:String,countryCode:String,lat:Double,lon:Double,timezone:String){self.name=name;self.region=region;self.country=country;self.countryCode=countryCode;self.lat=lat;self.lon=lon;self.timezone=timezone}
 public var id: String { "\(lat),\(lon),\(timezone)" }
 public var valid: Bool { !name.isEmpty && name.count < 120 && lat.isFinite && lon.isFinite && abs(lat)<=90 && abs(lon)<=180 && TimeZone(identifier:timezone) != nil }
 public static let presets: [Place] = [
 .init(name:"Honolulu",region:"Oʻahu",country:"United States",countryCode:"US",lat:21.3069,lon:-157.8583,timezone:"Pacific/Honolulu"),
 .init(name:"Seattle",region:"Washington",country:"United States",countryCode:"US",lat:47.6062,lon:-122.3321,timezone:"America/Los_Angeles"),
 .init(name:"San Francisco",region:"California",country:"United States",countryCode:"US",lat:37.7749,lon:-122.4194,timezone:"America/Los_Angeles"),
 .init(name:"Kailua",region:"Oʻahu",country:"United States",countryCode:"US",lat:21.3972,lon:-157.727,timezone:"Pacific/Honolulu"),
 .init(name:"Snoqualmie Pass",region:"Washington Cascades",country:"United States",countryCode:"US",lat:47.4229,lon:-121.4137,timezone:"America/Los_Angeles")]
}
public enum Display {
 public static func number(_ value: Any?) -> Double? { guard let n=value as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID(), n.doubleValue.isFinite else { return nil };return n.doubleValue }
 public static func value(_ n: Double?, digits: Int=0) -> String { guard let n, n.isFinite else{return "—"};return String(format:"%.*f",digits,n) }
 public static func temperature(_ n: Double?, unit:String) -> String { value(n.map{unit=="F" ? $0*9/5+32:$0}) }
 public static func wind(_ n: Double?, unit:String) -> String { value(n.map{unit=="F" ? $0/1.609344:$0}) }
 public static func wave(_ n: Double?, unit:String) -> String { value(n.map{unit=="F" ? $0*3.28084:$0},digits:1) }
 public static func rain(_ n: Double?, unit:String) -> String { value(n.map{unit=="F" ? $0/25.4:$0},digits:unit=="F" ? 2:1) }
 public static func condition(_ n: Double?) -> String { guard let n else{return "Conditions unavailable"};switch Int(n) {case 0:return "Clear skies";case 1...2:return "Partly cloudy";case 3:return "Overcast";case 45...48:return "Foggy";case 51...57:return "Drizzle";case 61...67:return "Rain";case 71...77:return "Snow";case 80...82:return "Rain showers";case 85...86:return "Snow showers";case 95...99:return "Thunderstorms";default:return "Conditions unavailable"} }
 public static func symbol(_ n:Double?) -> String {guard let n else{return "cloud"}; switch Int(n){case 0:return "sun.max.fill";case 1...2:return "cloud.sun.fill";case 3,45...48:return "cloud.fill";case 71...77,85...86:return "cloud.snow.fill";case 95...99:return "cloud.bolt.rain.fill";default:return "cloud.rain.fill"}}
 public static func time(_ t:Double?,zone:String,format:String="ha") -> String {guard let t,t.isFinite else{return "—"};let f=DateFormatter();f.timeZone=TimeZone(identifier:zone);f.dateFormat=format;return f.string(from:Date(timeIntervalSince1970:t))}
 public static func age(_ milliseconds:Double?,now:Date=Date()) -> String {guard let milliseconds else{return "Not received"};let mins=max(0,Int((now.timeIntervalSince1970-milliseconds/1000)/60));return mins<1 ? "Just updated":mins<60 ? "\(mins)m ago":"\(mins/60)h \(mins%60)m ago"}
 public static func distance(_ a:Place,lat:Double,lon:Double)->Double {let r=Double.pi/180;let x=pow(sin((lat-a.lat)*r/2),2)+cos(a.lat*r)*cos(lat*r)*pow(sin((lon-a.lon)*r/2),2);return 6371*2*asin(min(1,sqrt(x)))}
}
import CoreFoundation
