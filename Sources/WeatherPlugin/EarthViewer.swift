import AppKit
import SwiftUI
import WebKit
import WeatherCore

/// Earth reserves its full controls for a top-level page. Display that public page
/// in a separate, plugin-owned browser window, without injected scripts or host tools.
struct EarthViewer: View {
    let url: URL
    @State private var reloadID = UUID()
    @State private var unavailable = false
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Earth by Nullschool").font(.headline)
                Text("Public viewer · earth.nullschool.net").font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button("Reload") { unavailable = false; reloadID = UUID() }
            }.padding(12).background(.black.opacity(0.15))
            if unavailable {
                ContentUnavailableView("Earth couldn’t load", systemImage:"globe", description:Text("Check your internet connection, then choose Reload."))
            } else {
                EarthPage(url:url,onFailure:{ unavailable = true }).id(reloadID)
            }
        }.frame(minWidth:720,minHeight:480).preferredColorScheme(.dark)
    }
}
private struct EarthPage: NSViewRepresentable {
    let url:URL
    let onFailure:()->Void
    func makeCoordinator()->Coordinator {Coordinator(onFailure:onFailure)}
    func makeNSView(context:Context)->WKWebView {
        let configuration=WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically=false
        let view=WKWebView(frame:.zero,configuration:configuration)
        view.navigationDelegate=context.coordinator;view.uiDelegate=context.coordinator
        view.underPageBackgroundColor = .black
        view.load(URLRequest(url:url));return view
    }
    func updateNSView(_ view:WKWebView,context:Context){}
    static func dismantleNSView(_ view:WKWebView,coordinator:Coordinator){view.stopLoading();view.navigationDelegate=nil;view.uiDelegate=nil}
    final class Coordinator:NSObject,WKNavigationDelegate,WKUIDelegate {
        let onFailure:()->Void
        init(onFailure:@escaping ()->Void){self.onFailure=onFailure}
        func webView(_ webView:WKWebView,decidePolicyFor action:WKNavigationAction,decisionHandler:@escaping (WKNavigationActionPolicy)->Void){
            let url=action.request.url
            let allowed = !action.shouldPerformDownload && action.targetFrame?.isMainFrame == true && url?.scheme == "https" && url?.host == "earth.nullschool.net" && url?.user == nil && url?.password == nil && url?.port == nil
            decisionHandler(allowed ? .allow:.cancel)
        }
        func webView(_ webView:WKWebView,didFailProvisionalNavigation navigation:WKNavigation!,withError error:Error){if (error as NSError).code != NSURLErrorCancelled {onFailure()}}
        func webView(_ webView:WKWebView,didFail navigation:WKNavigation!,withError error:Error){if (error as NSError).code != NSURLErrorCancelled {onFailure()}}
        func webViewWebContentProcessDidTerminate(_ webView:WKWebView){onFailure()}
        func webView(_ webView:WKWebView,createWebViewWith configuration:WKWebViewConfiguration,for navigationAction:WKNavigationAction,windowFeatures:WKWindowFeatures)->WKWebView?{nil}
        func webView(_ webView:WKWebView,requestMediaCapturePermissionFor origin:WKSecurityOrigin,initiatedByFrame frame:WKFrameInfo,type:WKMediaCaptureType,decisionHandler:@escaping (WKPermissionDecision)->Void){decisionHandler(.deny)}
        func webView(_ webView:WKWebView,runOpenPanelWith parameters:WKOpenPanelParameters,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping ([URL]?)->Void){completionHandler(nil)}
    }
}
