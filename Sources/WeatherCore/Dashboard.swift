import Foundation

/// Bounded projection for the shared widescreen view. Missing readings remain null.
public enum Dashboard {
    public static func payload(place: Place, unit: String, ready: Bool, automatic: Bool, feeds: [String:[String:Any]], errors: [String:String], loading: Set<String>, message: String, now: Double = Date().timeIntervalSince1970) -> [String:Any] {
        func number(_ value: Any?) -> Any { guard let n = Display.number(value) else { return NSNull() }; return (n * 100).rounded() / 100 }
        func fields(_ input: Any?, _ keys: [String]) -> [String:Any] { let obj = input as? [String:Any] ?? [:]; return Dictionary(uniqueKeysWithValues:keys.map { ($0,number(obj[$0])) }) }
        func series(_ input: Any?, keys: [String], count: Int, after: Double) -> [String:Any] {
            let obj = input as? [String:Any] ?? [:], times = obj["time"] as? [Any] ?? []
            let indices = times.indices.filter { (Display.number(times[$0]) ?? 0) >= after }.prefix(count)
            return Dictionary(uniqueKeysWithValues: (["time"]+keys).map { key in let values = obj[key] as? [Any] ?? []; return (key,indices.map { number($0 < values.count ? values[$0] : nil) }) })
        }
        func text(_ value: Any?, _ limit: Int = 180) -> String { String((value as? String ?? "").prefix(limit)) }
        let w=feeds["weather"] ?? [:], m=feeds["marine"] ?? [:], tide=feeds["tides"] ?? [:]
        let alerts=(feeds["alerts"]?["alerts"] as? [[String:Any]] ?? []).prefix(6).map { a in Dictionary(uniqueKeysWithValues:["event","headline","severity","expires"].map { ($0,text(a[$0])) }) }
        let radar=((feeds["radar"]?["radar"] as? [String:Any])?["past"] as? [[String:Any]] ?? []).suffix(13).compactMap { f -> [String:Any]? in
            guard let path=f["path"] as? String, path.range(of:#"^/v2/radar/[a-zA-Z0-9_-]+$"#,options:.regularExpression) != nil, let time=Display.number(f["time"]) else { return nil }
            return ["id":String(path.dropFirst(10)),"time":time]
        }
        let iso=ISO8601DateFormatter();iso.formatOptions=[.withInternetDateTime,.withFractionalSeconds]
        let basic=ISO8601DateFormatter()
        let satellite=(feeds["satellite"]?["times"] as? [String] ?? []).suffix(12).compactMap { iso.date(from:$0) ?? basic.date(from:$0) }.map { Int($0.timeIntervalSince1970) }
        let station=tide["station"] as? [String:Any] ?? [:]
        let events=(tide["events"] as? [[String:Any]] ?? []).filter { (Display.number($0["time"]) ?? 0)>=now-1800 }.prefix(6).map { ["time":number($0["time"]),"height":number($0["height"]),"type":text($0["type"])] }
        let curve=(tide["curve"] as? [[String:Any]] ?? []).filter { let t=Display.number($0["time"]) ?? 0; return t>=now-3600 && t<=now+86400 }
        let sampled=curve.enumerated().filter { $0.offset % 5 == 0 }.prefix(52).map { [number($0.element["time"]),number($0.element["height"])] }
        let wind=feeds["wind"] ?? [:]
        let windPoints=(wind["points"] as? [[String:Any]] ?? []).prefix(25).map { p -> [String:Any] in
            ["lat":number(p["lat"]),"lon":number(p["lon"]),"speed":(p["speed"] as? [Any] ?? []).prefix(13).map(number),"direction":(p["direction"] as? [Any] ?? []).prefix(13).map(number)]
        }
        return ["place":["id":place.id,"name":place.name,"region":place.region,"lat":place.lat,"lon":place.lon,"timezone":place.timezone],"unit":unit,"ready":ready,"automatic":automatic,"message":message,"loading":Array(loading).sorted(),"errors":errors.mapValues { text($0,250) },
            "current":fields(w["current"],["time","temperature_2m","apparent_temperature","relative_humidity_2m","weather_code","wind_speed_10m","wind_direction_10m","wind_gusts_10m","is_day"]),"summary":text(w["summary"]),"provider":text(w["provider"]),"issued":text(w["issuedAt"]),"fetched":feeds.mapValues { number($0["fetchedAt"]) },
            "hourly":series(w["hourly"],keys:["temperature_2m","weather_code","precipitation_probability","precipitation","wind_speed_10m","wind_direction_10m"],count:24,after:now-3600),
            "daily":series(w["daily"],keys:["temperature_2m_max","temperature_2m_min","weather_code","precipitation_probability_max","sunrise","sunset"],count:7,after:now-86400),
            "marine":fields(m["current"],["wave_height","wave_period","wave_direction","swell_wave_height","swell_wave_period"]),"marinePoint":fields(m,["latitude","longitude"]),
            "marineHours":series(m["hourly"],keys:["wave_height","wave_period"],count:24,after:now-3600),
            "tideStation":["name":text(station["name"]),"distance":number(station["distance"])],"tidesSupported":tide["supported"] as? Bool ?? false,"tides":events,"tideCurve":sampled,
            "air":fields(feeds["air"]?["current"],["us_aqi","pm2_5"]),"alerts":alerts,"alertsSupported":feeds["alerts"]?["supported"] as? Bool ?? false,
            "radar":radar,"satellite":satellite,"windTimes":(wind["times"] as? [Any] ?? []).prefix(13).map(number),"windPoints":windPoints]
    }
}
