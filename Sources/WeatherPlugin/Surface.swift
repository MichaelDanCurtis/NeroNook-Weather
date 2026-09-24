import SwiftUI
import NookPluginSDK
import WeatherCore

extension WeatherModule {
    var customView: PluginCustomView { makeCustomView(allowFrames:supportsFrames) }
    func makeCustomView(allowFrames:Bool) -> PluginCustomView {
        var payload=Dashboard.payload(place:place,unit:unit,ready:located,automatic:preferences.automatic,feeds:feeds,errors:errors,loading:loading,message:locationMessage)
        payload["windyURL"]=allowFrames ? windyURL:""
        payload["windyMessage"]=allowFrames ? windyMessage:"Update NeroNook to show Windy here, or open Observatory."
        let bytes=(try? JSONSerialization.data(withJSONObject:payload,options:[.sortedKeys])) ?? Data()
        let data=bytes.count<=28000 ? String(data:bytes,encoding:.utf8) ?? "{}" : "{\"ready\":false,\"message\":\"Weather data exceeded the view limit. Open settings to refresh.\"}"
        return .init(entry:"observatory.html",revision:"observatory3",state:["data":.string(data)],events:[.init("settings"),.init("alerts"),.init("refresh"),.init("windySettings"),.init("unit",input:.init([.init("unit",.string)]))],resourceNamespaces:["tiles"],frames:allowFrames && !windyURL.isEmpty ? [.init(url:windyURL)]:nil)
    }
    func handleViewEvent(_ event: PluginViewEvent) throws {
        guard event.panelID=="observatory" else { throw ModuleProblem("Unknown weather view.") }
        try customView.validate(event)
        switch event.name {
        case "settings": showSettings()
        case "alerts": showSettings("Alerts")
        case "refresh": refresh()
        case "windySettings": showSettings("Sources")
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
