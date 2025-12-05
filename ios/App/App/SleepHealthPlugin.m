#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Forward declaration - the Swift class will be available at runtime
@class SleepHealthPlugin;

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(SleepHealthPlugin, "SleepHealth",
           CAP_PLUGIN_METHOD(requestAuthorization, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(readSleepSamples, CAPPluginReturnPromise);
)
