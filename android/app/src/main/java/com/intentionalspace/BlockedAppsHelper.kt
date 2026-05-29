package com.intentionalspace

import android.content.Context
import org.json.JSONObject

object BlockedAppsHelper {

    private val KEY_TO_PACKAGE = mapOf(
        "instagram" to "com.instagram.android",
        "youtube" to "com.google.android.youtube",
        "twitter" to "com.twitter.android",
        "reddit" to "com.reddit.frontpage",
        "facebook" to "com.facebook.katana",
    )

    private val PACKAGE_TO_KEY = KEY_TO_PACKAGE.entries.associate { (k, v) -> v to k }

    private val PACKAGE_TO_NAME = mapOf(
        "com.instagram.android" to "Instagram",
        "com.google.android.youtube" to "YouTube",
        "com.twitter.android" to "X/Twitter",
        "com.reddit.frontpage" to "Reddit",
        "com.facebook.katana" to "Facebook",
        "com.snapchat.android" to "Snapchat",
    )

    fun getAppName(packageName: String): String =
        PACKAGE_TO_NAME[packageName] ?: packageName

    fun packageToKey(packageName: String): String? = PACKAGE_TO_KEY[packageName]

    fun getBlockedPackageNames(context: Context): List<String> {
        val json = prefs(context).getString("blocked_apps", null)
        if (json.isNullOrBlank()) {
            return listOf(
                "com.instagram.android",
                "com.google.android.youtube",
            )
        }
        return try {
            val obj = JSONObject(json)
            KEY_TO_PACKAGE.entries
                .filter { obj.optBoolean(it.key, false) }
                .map { it.value }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun isBlocked(context: Context, packageName: String): Boolean {
        val appKey = packageToKey(packageName) ?: return false
        val json = prefs(context).getString("blocked_apps", null)

        if (json.isNullOrBlank()) {
            return packageName == "com.instagram.android" ||
                packageName == "com.google.android.youtube"
        }

        return try {
            val obj = JSONObject(json)
            obj.optBoolean(appKey, false)
        } catch (_: Exception) {
            false
        }
    }

    fun getSessionMinutes(context: Context, packageName: String): Int {
        val appKey = packageToKey(packageName) ?: return 15
        val json = prefs(context).getString("session_limits", null) ?: return 15

        return try {
            val obj = JSONObject(json)
            obj.optInt(appKey, 15).coerceIn(1, 480)
        } catch (_: Exception) {
            15
        }
    }

    /** Daily cap from onboarding / PerAppTimeService sync (minutes per day). */
    fun getDailyLimitMinutes(context: Context, packageName: String): Int {
        val appKey = packageToKey(packageName) ?: return 0
        val json = prefs(context).getString("app_time_limits", null) ?: return 0
        return try {
            JSONObject(json).optInt(appKey, 0).coerceIn(0, 24 * 60)
        } catch (_: Exception) {
            0
        }
    }

    fun getSyncedUsedMinutes(context: Context, packageName: String): Int {
        val appKey = packageToKey(packageName) ?: return 0
        val json = prefs(context).getString("app_used_time", null) ?: return 0
        return try {
            JSONObject(json).optInt(appKey, 0).coerceIn(0, 24 * 60)
        } catch (_: Exception) {
            0
        }
    }

    /**
     * Effective daily cap: explicit daily limit, else pause timer from Block tab.
     */
    fun getEffectiveDailyCapMinutes(context: Context, packageName: String): Int {
        val daily = getDailyLimitMinutes(context, packageName)
        if (daily > 0) return daily
        return getSessionMinutes(context, packageName)
    }

    fun isDailyLimitExceeded(context: Context, packageName: String): Boolean {
        val cap = getEffectiveDailyCapMinutes(context, packageName)
        if (cap <= 0) return false

        val usageStatsMinutes = UsageStatsHelper.getTodayUsageMinutes(context, packageName)
        val usageSyncedMinutes = getSyncedUsedMinutes(context, packageName)
        val usageToday = maxOf(usageStatsMinutes, usageSyncedMinutes)

        return usageToday >= cap
    }

    fun shouldIntervene(context: Context, packageName: String): Boolean {
        if (packageToKey(packageName) == null) return false

        if (!isBlocked(context, packageName)) {
            return false
        }

        // User chose a session length — honor it even if daily cap was already hit.
        if (UnlockStateStore.isUnlocked(context, packageName)) {
            return false
        }

        if (isDailyLimitExceeded(context, packageName)) {
            return true
        }

        return true
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences("IntentionalSpace", Context.MODE_PRIVATE)
}
