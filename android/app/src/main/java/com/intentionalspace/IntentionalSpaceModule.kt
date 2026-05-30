package com.intentionalspace

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class IntentionalSpaceModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "IntentionalSpaceModule"

    private fun prefs() =
        reactApplicationContext.getSharedPreferences("IntentionalSpace", Context.MODE_PRIVATE)

    @ReactMethod
    fun syncBlockedApps(json: String, promise: Promise) {
        try {
            prefs().edit().putString("blocked_apps", json).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", e.message)
        }
    }

    @ReactMethod
    fun syncSessionLimits(json: String, promise: Promise) {
        try {
            prefs().edit().putString("session_limits", json).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", e.message)
        }
    }

    @ReactMethod
    fun syncAppTimeData(json: String, promise: Promise) {
        try {
            val obj = org.json.JSONObject(json)
            val limits = obj.optJSONObject("limits")
            val used = obj.optJSONObject("used")
            val editor = prefs().edit()
            if (limits != null) {
                editor.putString("app_time_limits", limits.toString())
            }
            if (used != null) {
                editor.putString("app_used_time", used.toString())
            }
            editor.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getInterventionStatus(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val map = Arguments.createMap()
            map.putBoolean("accessibility", InterventionLauncher.isAccessibilityEnabled(ctx))
            map.putBoolean("overlay", OverlayPermissionHelper.canDrawOverlays(ctx))
            map.putBoolean("usageAccess", UsageStatsHelper.hasUsagePermission(ctx))
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("STATUS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun openOverlayPermissionSettings() {
        OverlayPermissionHelper.openOverlaySettings(reactApplicationContext)
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        reactApplicationContext.startActivity(
            android.content.Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS)
                .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK),
        )
    }

    @ReactMethod
    fun openUsageAccessSettings() {
        UsageStatsHelper.openUsageAccessSettings(reactApplicationContext)
    }

    @ReactMethod
    fun clearUnlock(packageName: String, promise: Promise) {
        try {
            UnlockStateStore.clearUnlock(reactApplicationContext, packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UNLOCK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun notifyUnlockExpired(packageName: String, promise: Promise) {
        try {
            UnlockExpiryScheduler.onUnlockExpired(reactApplicationContext, packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("EXPIRY_ERROR", e.message)
        }
    }

    @ReactMethod
    fun grantUnlock(packageName: String, minutes: Int, promise: Promise) {
        try {
            UnlockStateStore.grantUnlock(reactApplicationContext, packageName, minutes)
            AccessibilityService.markUnlockCooldown(packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UNLOCK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun exitTargetApp(packageName: String, promise: Promise) {
        try {
            AccessibilityService.markExitCooldown(packageName)
            TargetAppLauncher.exitApp(reactApplicationContext, packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("EXIT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun launchTargetApp(packageName: String, promise: Promise) {
        try {
            val launched = TargetAppLauncher.launch(reactApplicationContext, packageName)
            if (launched) {
                promise.resolve(true)
            } else {
                promise.reject("LAUNCH_ERROR", "Could not open app")
            }
        } catch (e: Exception) {
            promise.reject("LAUNCH_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getTodayOverviewStats(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val blockedPackages = BlockedAppsHelper.getBlockedPackageNames(ctx)
            val screenMinutes = UsageStatsHelper.getTodayTotalScreenMinutes(ctx)
            val blockedUsageMinutes = UsageStatsHelper.getTodayUsageMinutesForPackages(
                ctx,
                blockedPackages,
            )
            val attemptsToday = DailyStatsStore.getAttemptsToday(ctx)
            val grantedMinutesToday = DailyStatsStore.getGrantedMinutesToday(ctx)
            val timeSavedMinutes = (grantedMinutesToday - blockedUsageMinutes).coerceAtLeast(0)

            val map = Arguments.createMap()
            map.putInt("todayScreenMinutes", screenMinutes)
            map.putInt("blockedAppUsageMinutes", blockedUsageMinutes)
            map.putInt("attemptsToday", attemptsToday)
            map.putInt("grantedMinutesToday", grantedMinutesToday)
            map.putInt("timeSavedMinutes", timeSavedMinutes)
            map.putBoolean("hasUsagePermission", UsageStatsHelper.hasUsagePermission(ctx))
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("STATS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun finishIntervention(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity != null) {
                activity.moveTaskToBack(true)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("FINISH_ERROR", e.message)
        }
    }
}
