import Foundation
import Security
import SwiftUI
import WeatherCore

/// The provider key never enters host snapshots, settings JSON, arguments or logs.
enum WindyKey {
    private static var query: [String: Any] { [kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:moduleID+".windy",kSecAttrAccount as String:"map-forecast"] }
    static func read() -> String? {
        var q=query;q[kSecReturnData as String]=true;q[kSecMatchLimit as String]=kSecMatchLimitOne
        var result:CFTypeRef?;guard SecItemCopyMatching(q as CFDictionary,&result)==errSecSuccess,let data=result as? Data else{return nil}
        return String(data:data,encoding:.utf8)
    }
    static func save(_ key:String) throws {
        let data=Data(key.utf8);let result=SecItemUpdate(query as CFDictionary,[kSecValueData as String:data] as CFDictionary)
        if result==errSecItemNotFound { var q=query;q[kSecValueData as String]=data;q[kSecAttrAccessible as String]=kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;guard SecItemAdd(q as CFDictionary,nil)==errSecSuccess else{throw CocoaError(.fileWriteNoPermission)} }
        else if result != errSecSuccess {throw CocoaError(.fileWriteNoPermission)}
    }
    static func remove() throws {let result=SecItemDelete(query as CFDictionary);guard result==errSecSuccess || result==errSecItemNotFound else{throw CocoaError(.fileWriteNoPermission)}}
}
struct WindySettings: View {
    @ObservedObject var model:WeatherModule
    @State private var key=""
    var body:some View {
        VStack(alignment:.leading,spacing:14){
            Text("Wind & temperature maps").font(.title2.bold())
            Picker("Map provider",selection:Binding(get:{model.preferences.mapProvider},set:{model.setMapProvider($0.rawValue)})){
                ForEach(MapProvider.allCases,id:\.self){Text($0.title).tag($0)}
            }.pickerStyle(.segmented)
            if model.preferences.mapProvider == .earth {
                Text("Earth by Nullschool").font(.headline)
                Text("See wind and temperature previews in the Nook. Open Earth viewer for its full menu, zoom, units and dates. No account or key is needed.").foregroundStyle(.secondary)
                Text("Use the provider selector on the map to switch at any time. Your saved Windy key stays in Keychain.").font(.callout).foregroundStyle(.secondary)
                Link("About Earth and its data",destination:URL(string:"https://earth.nullschool.net/about.html")!)
            } else {
                Text("Your Windy account").font(.headline)
                Text("Each user connects their own Map Forecast API key. A regular Windy or Premium login alone does not enable these maps.").foregroundStyle(.secondary)
                Link("1. Sign up or sign in to Windy",destination:URL(string:"https://api.windy.com/keys")!)
                Text("2. Create a Map Forecast API key for NeroNook. For local testing, use app ID cafe.nero.plugin.weather and allow localhost and 127.0.0.1.").font(.callout).foregroundStyle(.secondary).textSelection(.enabled)
                Text("3. Paste your key below. It stays in this plugin’s Keychain.").font(.callout).foregroundStyle(.secondary)
                SecureField("Your Map Forecast API key",text:$key).textFieldStyle(.roundedBorder)
                HStack {
                    Button("Save Windy key"){model.saveWindyKey(key);key=""}.disabled(key.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty)
                    Button("Reconnect"){model.connectWindy()}.disabled(!model.hasWindyKey)
                    Button("Remove key"){model.removeWindyKey()}.disabled(!model.hasWindyKey)
                }
                Text(model.windyMessage).foregroundStyle(model.windyURL.isEmpty ? Color.secondary:Color.green)
                Text("The free testing key is for development only (500 sessions/day). Production use needs an appropriate Windy plan. Choosing Windy does not sign you up or start a subscription.").font(.callout).foregroundStyle(.secondary)
            }
        }.padding(20).frame(maxWidth:.infinity,alignment:.leading).background(.white.opacity(0.04),in:RoundedRectangle(cornerRadius:14))
    }
}
