#import <Capacitor/Capacitor.h>
#import <HealthKit/HealthKit.h>

@interface SleepHealthPlugin : CAPPlugin
@property (nonatomic, strong) HKHealthStore *healthStore;

- (void)requestAuthorization:(CAPPluginCall *)call;
- (void)readSleepSamples:(CAPPluginCall *)call;

@end
