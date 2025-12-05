#import "SleepHealthPlugin.h"

@implementation SleepHealthPlugin

- (void)load {
    self.healthStore = [[HKHealthStore alloc] init];
}

- (NSString *)sleepCategoryValueToString:(NSInteger)value {
    switch (value) {
        case HKCategoryValueSleepAnalysisInBed:
            return @"inBed";
        case HKCategoryValueSleepAnalysisAsleep:
            return @"asleep";
        case HKCategoryValueSleepAnalysisAwake:
            return @"awake";
        default:
            return @"unknown";
    }
}

- (void)requestAuthorization:(CAPPluginCall *)call {
    if (![HKHealthStore isHealthDataAvailable]) {
        [call reject:@"Health data is not available on this device" :@"UNAVAILABLE" :nil :nil];
        return;
    }

    HKObjectType *sleepType =
        [HKObjectType categoryTypeForIdentifier:HKCategoryTypeIdentifierSleepAnalysis];
    if (!sleepType) {
        [call reject:@"Sleep analysis type is not available" :@"UNAVAILABLE" :nil :nil];
        return;
    }

    [self.healthStore requestAuthorizationToShareTypes:nil
                                             readTypes:[NSSet setWithObject:sleepType]
                                            completion:^(BOOL success, NSError * _Nullable error) {
        // 에러가 없으면 항상 성공으로 처리
        // HealthKit은 프라이버시 보호를 위해 실제 권한 상태를 숨김
        if (!error) {
            [call resolve:@{@"authorized": @YES}];
        } else {
            [call reject:[NSString stringWithFormat:@"Authorization failed: %@", error.localizedDescription] :@"AUTH_FAILED" :error :nil];
        }
    }];
}

- (void)readSleepSamples:(CAPPluginCall *)call {
    if (![HKHealthStore isHealthDataAvailable]) {
        [call reject:@"Health data is not available on this device" :@"UNAVAILABLE" :nil :nil];
        return;
    }

    HKObjectType *sleepType =
        [HKObjectType categoryTypeForIdentifier:HKCategoryTypeIdentifierSleepAnalysis];
    if (!sleepType) {
        [call reject:@"Sleep analysis type is not available" :@"UNAVAILABLE" :nil :nil];
        return;
    }

    NSString *startDateString = [call.options[@"startDate"] isKindOfClass:[NSString class]] ? call.options[@"startDate"] : nil;
    NSString *endDateString = [call.options[@"endDate"] isKindOfClass:[NSString class]] ? call.options[@"endDate"] : nil;
    NSInteger limit = [call.options[@"limit"] isKindOfClass:[NSNumber class]] ? [call.options[@"limit"] integerValue] : 100;

    NSISO8601DateFormatter *formatter = [[NSISO8601DateFormatter alloc] init];
    formatter.formatOptions =
        NSISO8601DateFormatWithInternetDateTime | NSISO8601DateFormatWithFractionalSeconds;

    NSDate *startDate;
    NSDate *endDate;

    if (startDateString && [formatter dateFromString:startDateString]) {
        startDate = [formatter dateFromString:startDateString];
    } else {
        NSCalendar *calendar = [NSCalendar currentCalendar];
        startDate = [calendar startOfDayForDate:[NSDate date]];
    }

    if (endDateString && [formatter dateFromString:endDateString]) {
        endDate = [formatter dateFromString:endDateString];
    } else {
        endDate = [NSDate date];
    }

    NSPredicate *predicate = [HKQuery predicateForSamplesWithStartDate:startDate
                                                               endDate:endDate
                                                               options:HKQueryOptionNone];

    NSSortDescriptor *sortDescriptor =
        [NSSortDescriptor sortDescriptorWithKey:HKSampleSortIdentifierStartDate
                                       ascending:NO];

    HKSampleQuery *query =
        [[HKSampleQuery alloc] initWithSampleType:(HKSampleType *)sleepType
                                        predicate:predicate
                                            limit:limit
                                  sortDescriptors:@[sortDescriptor]
                                   resultsHandler:
         ^(HKSampleQuery * _Nonnull query,
           NSArray<__kindof HKSample *> * _Nullable samples,
           NSError * _Nullable error) {

        if (error) {
            [call reject:[NSString stringWithFormat:@"Failed to read sleep samples: %@", error.localizedDescription] :@"READ_FAILED" :error :nil];
            return;
        }

        if (!samples || ![samples isKindOfClass:[NSArray class]]) {
            [call resolve:@{@"samples": @[]}];
            return;
        }

        NSMutableArray *results = [NSMutableArray array];

        for (HKCategorySample *sample in samples) {
            if ([sample isKindOfClass:[HKCategorySample class]]) {
                NSMutableDictionary *result = [NSMutableDictionary dictionary];
                result[@"startDate"]   = [formatter stringFromDate:sample.startDate];
                result[@"endDate"]     = [formatter stringFromDate:sample.endDate];
                result[@"value"]       = @(sample.value);
                result[@"categoryType"]= [self sleepCategoryValueToString:sample.value];
                result[@"sourceName"]  = sample.sourceRevision.source.name;
                result[@"sourceId"]    = sample.sourceRevision.source.bundleIdentifier;
                [results addObject:result];
            }
        }

        [call resolve:@{@"samples": results}];
    }];

    [self.healthStore executeQuery:query];
}

@end
