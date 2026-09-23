import AppKit
import CoreLocation
import SwiftUI
import WeatherCore
import NookPluginSDK
let moduleID="cafe.nero.plugin.weather"
struct Preferences:Codable {var place=Place.presets[0];var unit="F";var automatic=true}
@MainActor final class WeatherModule:NSObject,NSApplicationDelegate,ObservableObject, NSWindowDelegate {
 @Published var detailVisible=false
 @Published var locationMessage="Finding this Mac’s location…";@Published var located=false;private let locationManager=CLLocationManager();private let geocoder=CLGeocoder();private var locationCheck=Date.distantPast
 @Published var preferences=Preferences();@Published var feeds:[String:[String:Any]]=[:];@Published var errors:[String:String]=[:];@Published var loading=Set<String>();@Published var query="";@Published var results:[Place]=[];@Published var searchError="";@Published var tab="Now";@Published var revision=0
 let feedNames=["weather","marine","air","alerts","radar","satellite","cyclones","tides"]
 private let worker=WeatherWorker();private var requests:[String:(String,String,Date)]=[:];private var timer:Timer?;private var session:UUID?;private var sequence:UInt64=0;private let input=LineReader();private var window:NSWindow?;private var lastRefresh=Date.distantPast;private var visible=true
 var place:Place{preferences.place};var unit:String{preferences.unit};var weather:[String:Any]{feeds["weather"] ?? [:]};var current:[String:Any]{weather["current"] as? [String:Any] ?? [:]}
 var currentTemp:String{Display.temperature(Display.number(current["temperature_2m"]),unit:unit)}
 var condition:String{weather["summary"] as? String ?? Display.condition(Display.number(current["weather_code"]))}
 var status:String{if preferences.automatic && !located{return locationMessage};return "\(place.name) · \(currentTemp)°\(unit) · \(errors["weather"] != nil ? "Refresh unavailable":Display.age(Display.number(weather["fetchedAt"])))"}
 var storage:URL?{try? PluginStorage.directory(id:moduleID)}
 func applicationDidFinishLaunching(_ notification:Notification){
  NSApp.setActivationPolicy(.accessory)
  if let file=storage?.appendingPathComponent("settings.json"),let data=try? Data(contentsOf:file),let saved=try? JSONDecoder().decode(Preferences.self,from:data),saved.place.valid,["F","C"].contains(saved.unit){preferences=saved}
  located = !preferences.automatic; if located {loadCache()}
  locationManager.delegate=self;locationManager.desiredAccuracy=kCLLocationAccuracyKilometer
  worker.onReply={ [weak self] in self?.receiveFeed($0) };worker.onExit={ [weak self] in guard let self else{return};for feed in self.loading{self.errors[feed]="Weather worker stopped. Refresh to reconnect."};self.loading=[];self.requests=[:];self.publish() }
  if CommandLine.arguments.contains("--neronook-plugin") {FileHandle.standardInput.readabilityHandler={ [weak self] file in let data=file.availableData;Task{@MainActor in guard let self else{return};if data.isEmpty{NSApp.terminate(nil);return};for line in self.input.append(data){if let m=try? JSONDecoder().decode(PluginMessage.self,from:line){self.receive(m)}}} }} else {showWindow();refresh()}
  if preferences.automatic {locate()}
  timer=Timer.scheduledTimer(withTimeInterval:2,repeats:true){ [weak self] _ in Task{@MainActor in guard let self else{return};if self.preferences.automatic && Date().timeIntervalSince(self.locationCheck)>1800 {self.locate()};let expired=self.requests.filter{Date().timeIntervalSince($0.value.2)>75};for(id,(feed,_,_)) in expired{self.requests[id]=nil;self.loading.remove(feed);self.errors[feed]="Weather request timed out."};if Date().timeIntervalSince(self.lastRefresh)>300 && (self.visible || self.window?.isVisible == true){self.refresh()};self.publish()} }
 }
 func applicationWillTerminate(_ notification:Notification){worker.stop()}
 func select(_ value:Place){guard value.valid else{return};preferences.automatic=false;located=true;preferences.place=value;feeds=[:];errors=[:];loading=[];requests=[:];results=[];save();loadCache();refresh()}
 func setUnit(_ value:String){guard ["F","C"].contains(value) else{return};preferences.unit=value;save();publish()}
 private func save(){if let file=storage?.appendingPathComponent("settings.json"){try? JSONEncoder().encode(preferences).write(to:file,options:.atomic)}}
 private func cacheURL()->URL?{storage?.appendingPathComponent("cache-\(place.lat)-\(place.lon).json")}
 private func loadCache(){guard let file=cacheURL(),let data=try? Data(contentsOf:file),data.count<8_000_000,let raw=(try? JSONSerialization.jsonObject(with:data)) as? [String:[String:Any]] else{return};for (key,value) in raw{if let fetched=Display.number(value["fetchedAt"]),Date().timeIntervalSince1970-fetched/1000<3600{feeds[key]=value;errors[key]="Saved reading; waiting for refresh."}}}
 func refresh(){guard !preferences.automatic || located else{return};lastRefresh=Date();for name in feedNames where !loading.contains(name){let id=UUID().uuidString;requests[id]=(name,place.id,Date());loading.insert(name);do{let p=try JSONSerialization.jsonObject(with:JSONEncoder().encode(place));try worker.send(["id":id,"action":"feed","feed":name,"place":p])}catch{loading.remove(name);requests[id]=nil;errors[name]="Could not start bundled weather worker."}};publish()}
 func search(){guard query.trimmingCharacters(in:.whitespacesAndNewlines).count>=2,!loading.contains("search") else{return};let id=UUID().uuidString;requests[id]=("search",place.id,Date());loading.insert("search");searchError="";do{try worker.send(["id":id,"action":"search","query":String(query.prefix(100))])}catch{loading.remove("search");searchError="Location search unavailable."}}
 private func receiveFeed(_ reply:[String:Any]){guard let id=reply["id"] as? String,let (name,location,_)=requests.removeValue(forKey:id),location==place.id else{return};loading.remove(name);let data=reply["data"] as? [String:Any] ?? [:]
  if name=="search"{if reply["ok"] as? Bool == true,let raw=data["results"],let bytes=try? JSONSerialization.data(withJSONObject:raw){results=((try? JSONDecoder().decode([Place].self,from:bytes)) ?? []).filter(\.valid);searchError=results.isEmpty ? "No matching places.":""}else{searchError=data["error"] as? String ?? "Search unavailable"};return}
  if reply["ok"] as? Bool == true {feeds[name]=data;errors[name]=data["stale"] as? Bool == true ? data["warning"] as? String ?? "Previous reading; refresh unavailable":nil;if let file=cacheURL(),let bytes=try? JSONSerialization.data(withJSONObject:feeds){try? bytes.write(to:file,options:.atomic)}}else{errors[name]=String((data["error"] as? String ?? "Feed unavailable").prefix(250))}
  revision+=1;publish()
 }
 func row(_ feed:String,_ group:String,_ key:String)->[Double?]{((feeds[feed]?[group] as? [String:Any])?[key] as? [Any] ?? []).map{Display.number($0)}}
 func number(_ feed:String,_ group:String,_ key:String)->Double?{Display.number((feeds[feed]?[group] as? [String:Any])?[key])}
 func source(_ feed:String)->String {switch feed{case "weather":return weather["provider"] as? String ?? "NOAA / Open-Meteo / MET Norway";case "marine":return "Open-Meteo Marine · ocean model";case "air":return "CAMS via Open-Meteo · modeled AQI";case "alerts":return "NOAA / NWS · point alerts";case "radar":return "RainViewer · radar observations";case "satellite":return "NOAA nowCOAST · infrared observations";case "tides":return "NOAA CO-OPS · tide predictions, MLLW";default:return "NOAA NHC / CPHC"}}
 func age(_ feed:String)->String{Display.age(Display.number(feeds[feed]?["fetchedAt"]))}
 func windowWillClose(_ notification:Notification){detailVisible=false}
 func showWindow(){detailVisible=true;if window==nil{let w=NSWindow(contentRect:NSRect(x:0,y:0,width:1040,height:760),styleMask:[.titled,.closable,.miniaturizable,.resizable],backing:.buffered,defer:false);w.delegate=self;w.title="Weather Observatory";w.contentView=NSHostingView(rootView:ObservatoryView(model:self));w.minSize=NSSize(width:880,height:660);w.isReleasedWhenClosed=false;w.center();window=w};window?.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)}
 private func receive(_ m:PluginMessage){guard m.pluginID==moduleID else{return};if session==nil{guard m.type=="hello" else{return};session=m.session;emit("ready",features:["actions-v1","dashboard-v1","panels-v1","diagrams-v1"]);send(.init(.register,registration:.init(actions:[.init("read_status",title:"Read weather status",output:.init([.init("location",.string),.init("message",.string),.init("available",.boolean)]))],channels:[.init("status",title:"Weather status",kind:.state,schema:.init([.init("location",.string),.init("message",.string),.init("available",.boolean)]))])));refresh();return};guard m.session==session else{return};if m.type=="visibility"{visible=m.visible ?? false};if m.type=="action"{switch m.action{case "configure","details":showWindow();case "map":tab="Map";showWindow();case "refresh":refresh();default:break}};if let b=m.bus,m.type=="bus",b.operation == .execute{let valid=b.address?.name=="read_status" && b.address?.plugin==moduleID;send(.init(.update,requestID:b.requestID,update:.init(valid ? .succeeded:.failed,values:valid ? values:[:])))} }
 var values:[String:PluginValue]{["location":.string(place.name),"message":.string(status),"available":.boolean(feeds["weather"] != nil && errors["weather"] == nil)]}
 func publish(){guard session != nil else{return};let snapshot=PluginSnapshot(title:"Weather Observatory",status:status,activity:String(status.prefix(100)),actions:[.init("details","Open Observatory",symbol:"arrow.up.left.and.arrow.down.right"),.init("map","Weather map",symbol:"map"),.init("refresh","Refresh",enabled:loading.isEmpty,symbol:"arrow.clockwise")],badge:errors["weather"] != nil ? "Stale / unavailable":feeds["weather"] == nil ? "Loading":"Forecast",panels:[.init("now","Now",diagrams:[weatherDiagram(self,page:"Now")]),.init("forecast","Forecast",diagrams:[weatherDiagram(self,page:"Forecast")]),.init("marine","Marine",diagrams:[weatherDiagram(self,page:"Marine")]),.init("sources","Sources",sections:feedNames.map{.init(source($0),"\(age($0))\n\(errors[$0] ?? (loading.contains($0) ? "Refreshing…":feeds[$0] == nil ? "Not received":"Received"))")} + [.init("Google layers","WeatherNext and Earth Engine require an independent authorized connection. Site credentials are not imported.")])]);emit("snapshot",snapshot:snapshot);send(.init(.publish,address:.init(moduleID,"status"),values:values,lifetime:8))}
 private func send(_ bus:PluginBusMessage){emit("bus",bus:bus)}
 private func emit(_ type:String,features:[String]?=nil,snapshot:PluginSnapshot?=nil,bus:PluginBusMessage?=nil){guard let session else{return};if type != "ready"{sequence+=1};if let data=try? PluginMessage(type:type,pluginID:moduleID,session:session,sequence:sequence,snapshot:snapshot,features:features,bus:bus).encoded(){try? FileHandle.standardOutput.write(contentsOf:data)}}
}

extension WeatherModule: @preconcurrency CLLocationManagerDelegate {
 func setAutomatic(_ value:Bool){preferences.automatic=value;save();if value {located=false;feeds=[:];errors=[:];loading=[];requests=[:];locate()}else{located=true;refresh()}}
 func locate(){guard !CommandLine.arguments.contains("--protocol-test") else{return};locationCheck=Date();locationMessage="Finding this Mac’s location…";switch locationManager.authorizationStatus{case .notDetermined:locationManager.requestWhenInUseAuthorization();case .authorizedAlways,.authorizedWhenInUse:locationManager.requestLocation();case .denied,.restricted:locationMessage="Allow Location access or choose a place";default:break};publish()}
 func locationManagerDidChangeAuthorization(_ manager:CLLocationManager){if preferences.automatic{locate()}}
 func locationManager(_ manager:CLLocationManager,didFailWithError error:Error){locationMessage="Location unavailable · choose a place or retry";publish()}
 func locationManager(_ manager:CLLocationManager,didUpdateLocations locations:[CLLocation]){
  guard preferences.automatic,let location=locations.last,location.horizontalAccuracy>=0,abs(location.timestamp.timeIntervalSinceNow)<300 else{return}
  geocoder.reverseGeocodeLocation(location, preferredLocale: nil, completionHandler: { [weak owner = self] marks,error in Task{@MainActor in guard let owner,owner.preferences.automatic else{return};let mark=marks?.first
   let value=Place(name:mark?.locality ?? mark?.administrativeArea ?? "Current location",region:mark?.administrativeArea ?? "",country:mark?.country ?? "",countryCode:mark?.isoCountryCode ?? "",lat:(location.coordinate.latitude*1000).rounded()/1000,lon:(location.coordinate.longitude*1000).rounded()/1000,timezone:mark?.timeZone?.identifier ?? TimeZone.current.identifier)
   guard value.valid else{return};let changed=owner.place.id != value.id;owner.preferences.place=value;owner.located=true;owner.locationMessage="This Mac · \(value.name)";if changed{owner.feeds=[:];owner.errors=[:];owner.loading=[];owner.requests=[:]};owner.save();owner.refresh()
  }})
 }
}
