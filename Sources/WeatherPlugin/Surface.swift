import SwiftUI
import NookPluginSDK
import WeatherCore

extension WeatherModule {
    var customView: PluginCustomView { makeCustomView(allowFrames:supportsFrames,allowHTTPS:supportsHTTPSFrames) }
    func makeCustomView(allowFrames:Bool,allowHTTPS:Bool = true) -> PluginCustomView {
        var payload=Dashboard.payload(place:place,unit:unit,ready:located,automatic:preferences.automatic,feeds:feeds,errors:errors,loading:loading,message:locationMessage)
        payload["mapProvider"]=preferences.mapProvider.rawValue
        payload["earthURL"]=allowFrames && allowHTTPS ? "https://earth.nullschool.net/":""
        payload["earthMessage"]=allowFrames && allowHTTPS ? "":"Update NeroNook to show Earth here, or open Observatory."
        var frames:[PluginViewFrame]=[]
        if allowFrames && allowHTTPS {frames.append(.init(url:"https://earth.nullschool.net/"))}
        if allowFrames && !windyURL.isEmpty {frames.append(.init(url:windyURL))}
        payload["windyURL"]=allowFrames ? windyURL:""
        payload["windyMessage"]=allowFrames ? windyMessage:"Update NeroNook to show Windy here, or open Observatory."
        let bytes=(try? JSONSerialization.data(withJSONObject:payload,options:[.sortedKeys])) ?? Data()
        let data=bytes.count<=28000 ? String(data:bytes,encoding:.utf8) ?? "{}" : "{\"ready\":false,\"message\":\"Weather data exceeded the view limit. Open settings to refresh.\"}"
        return .init(entry:"observatory.html",revision:"observatory4",state:["data":.string(data)],events:[.init("settings"),.init("alerts"),.init("refresh"),.init("windySettings"),.init("earthViewer",input:.init([.init("layer",.string)])),.init("mapProvider",input:.init([.init("provider",.string)])),.init("unit",input:.init([.init("unit",.string)]))],resourceNamespaces:["tiles"],frames:frames.isEmpty ? nil:frames)
    }
    func handleViewEvent(_ event: PluginViewEvent) throws {
        guard event.panelID=="observatory" else { throw ModuleProblem("Unknown weather view.") }
        try customView.validate(event)
        switch event.name {
        case "settings": showSettings()
        case "alerts": showSettings("Alerts")
        case "refresh": refresh()
        case "windySettings": showSettings("Sources")
        case "earthViewer": if case .string(let layer)=event.values["layer"] { showEarth(layer) }
        case "mapProvider": if case .string(let value)=event.values["provider"] { setMapProvider(value) }
        case "unit": if case .string(let unit)=event.values["unit"] { setUnit(unit) }
        default: break
        }
    }
    func resource(_ request: PluginViewResourceRequest) async throws -> PluginViewResourceResult {
        guard located,request.panelID=="observatory" else { throw ModuleProblem("Weather map unavailable.") }
        try customView.validate(request)
        let payload=Dashboard.payload(place:place,unit:unit,ready:located,automatic:preferences.automatic,feeds:feeds,errors:errors,loading:loading,message:locationMessage)
        let radar=Set((payload["radar"] as? [[String:Any]] ?? []).compactMap { ($0["id"] as? String).map { "/v2/radar/"+$0 } })
        let satellite=Set(payload["satellite"] as? [Int] ?? [])
        return try await tiles.load(request,radar:radar,satellite:satellite)
    }
}
struct WeatherSurface: View {
    @ObservedObject var model: WeatherModule
    var body: some View {
        PluginWebSurface(root:Bundle.main.resourceURL!.appendingPathComponent("Views"),panelID:"observatory",definition:model.makeCustomView(allowFrames:true),onResource:{try await model.resource($0)}) { try model.handleViewEvent($0) }
            .aspectRatio(16/9,contentMode:.fit).frame(maxWidth:.infinity,maxHeight:.infinity).background(Color(red:0.045,green:0.068,blue:0.10)).preferredColorScheme(.dark)
    }
}
