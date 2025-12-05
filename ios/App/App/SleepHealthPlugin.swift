import Foundation
import Capacitor
import HealthKit

@objc(SleepHealthPlugin)
public class SleepHealthPlugin: CAPPlugin {
    private let healthStore = HKHealthStore()
    
    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Health data is not available on this device")
            return
        }
        
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            call.reject("Sleep analysis type is not available")
            return
        }
        
        healthStore.requestAuthorization(toShare: nil, read: [sleepType]) { success, error in
            if let error = error {
                call.reject("Authorization failed: \(error.localizedDescription)")
                return
            }
            
            if success {
                call.resolve(["authorized": true])
            } else {
                call.reject("Authorization was denied")
            }
        }
    }
    
    @objc func readSleepSamples(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Health data is not available on this device")
            return
        }
        
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            call.reject("Sleep analysis type is not available")
            return
        }
        
        let startDateString = call.getString("startDate")
        let endDateString = call.getString("endDate")
        let limit = call.getInt("limit") ?? 100
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        var startDate: Date
        var endDate: Date
        
        if let startDateString = startDateString, let parsedStart = formatter.date(from: startDateString) {
            startDate = parsedStart
        } else {
            startDate = Calendar.current.startOfDay(for: Date())
        }
        
        if let endDateString = endDateString, let parsedEnd = formatter.date(from: endDateString) {
            endDate = parsedEnd
        } else {
            endDate = Date()
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: [])
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: limit, sortDescriptors: [sortDescriptor]) { _, samples, error in
            if let error = error {
                call.reject("Failed to read sleep samples: \(error.localizedDescription)")
                return
            }
            
            guard let categorySamples = samples as? [HKCategorySample] else {
                call.resolve(["samples": []])
                return
            }
            
            let results = categorySamples.map { sample -> [String: Any] in
                var result: [String: Any] = [
                    "startDate": formatter.string(from: sample.startDate),
                    "endDate": formatter.string(from: sample.endDate),
                    "value": sample.value,
                    "categoryType": self.sleepCategoryValueToString(sample.value),
                    "sourceName": sample.sourceRevision.source.name,
                    "sourceId": sample.sourceRevision.source.bundleIdentifier
                ]
                
                return result
            }
            
            call.resolve(["samples": results])
        }
        
        healthStore.execute(query)
    }
    
    private func sleepCategoryValueToString(_ value: Int) -> String {
        switch value {
        case HKCategoryValueSleepAnalysis.inBed.rawValue:
            return "inBed"
        case HKCategoryValueSleepAnalysis.asleep.rawValue:
            return "asleep"
        case HKCategoryValueSleepAnalysis.awake.rawValue:
            return "awake"
        default:
            return "unknown"
        }
    }
}
