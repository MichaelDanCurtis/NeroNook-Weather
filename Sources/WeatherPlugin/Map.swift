import SwiftUI
import NookPluginSDK
import WebKit
struct WeatherMap:NSViewRepresentable {
 @ObservedObject var model:WeatherModule
 func makeCoordinator()->Coordinator{Coordinator()}
 func makeNSView(context:Context)->WKWebView{let web=WKWebView(frame:.zero);web.navigationDelegate=context.coordinator;web.setValue(false,forKey:"drawsBackground");if let url=Bundle.main.resourceURL?.appendingPathComponent("Web/map.html"){web.loadFileURL(url,allowingReadAccessTo:url.deletingLastPathComponent())};context.coordinator.web=web;return web}
 func updateNSView(_ web:WKWebView,context:Context){let object:[String:Any]=["lat":model.place.lat,"lon":model.place.lon,"name":model.place.name,"radar":model.feeds["radar"] ?? [:],"satellite":model.feeds["satellite"] ?? [:],"cyclones":model.feeds["cyclones"] ?? [:]];if let data=try? JSONSerialization.data(withJSONObject:object),let json=String(data:data,encoding:.utf8){context.coordinator.json=json;context.coordinator.update()}}
 static func dismantleNSView(_ nsView:WKWebView,coordinator:Coordinator){nsView.stopLoading();nsView.loadHTMLString("",baseURL:nil)}
 final class Coordinator:NSObject,WKNavigationDelegate {weak var web:WKWebView?;var json="{}";var ready=false;var previous="";func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){ready=true;update()};func update(){guard ready,json != previous else{return};previous=json;web?.evaluateJavaScript("window.setWeather(\(json))",completionHandler:nil)};func webView(_ webView:WKWebView,decidePolicyFor navigationAction:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void){guard let url=navigationAction.request.url else{decisionHandler(.cancel);return};if url.isFileURL{decisionHandler(.allow)}else{decisionHandler(.cancel);if navigationAction.navigationType == .linkActivated,url.scheme=="https"{NSWorkspace.shared.open(url)}}}}
}
