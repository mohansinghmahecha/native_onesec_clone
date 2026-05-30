package com.intentionalspace

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import java.util.Calendar

object UsageStatsHelper {

    fun hasUsagePermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName,
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName,
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun openUsageAccessSettings(context: Context) {
        context.startActivity(
            Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
    }

    /** Total foreground time today for package, in whole minutes. */
    fun getTodayUsageMinutes(context: Context, packageName: String): Int {
        if (!hasUsagePermission(context)) return 0

        return try {
            val usageStatsManager =
                context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val end = System.currentTimeMillis()
            val start = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }.timeInMillis

            val stats = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                start,
                end,
            ) ?: return 0

            val totalMs = stats
                .filter { it.packageName == packageName }
                .sumOf { it.totalTimeInForeground }

            (totalMs / 60_000L).toInt()
        } catch (_: Exception) {
            0
        }
    }

    /** Total foreground time today across all apps (whole minutes). */
    fun getTodayTotalScreenMinutes(context: Context): Int {
        if (!hasUsagePermission(context)) return 0

        return try {
            val stats = queryTodayStats(context) ?: return 0
            val totalMs = stats
                .filter { !isExcludedPackage(it.packageName) }
                .sumOf { it.totalTimeInForeground }
            (totalMs / 60_000L).toInt()
        } catch (_: Exception) {
            0
        }
    }

    /** Sum of today's usage for the given packages. */
    fun getTodayUsageMinutesForPackages(
        context: Context,
        packageNames: Collection<String>,
    ): Int {
        if (!hasUsagePermission(context) || packageNames.isEmpty()) return 0
        val set = packageNames.toSet()

        return try {
            val stats = queryTodayStats(context) ?: return 0
            val totalMs = stats
                .filter { set.contains(it.packageName) }
                .sumOf { it.totalTimeInForeground }
            (totalMs / 60_000L).toInt()
        } catch (_: Exception) {
            0
        }
    }

    /** True if this package was the most recently used app within [withinMs]. */
    fun isPackageRecentlyForeground(
        context: Context,
        packageName: String,
        withinMs: Long = 60_000L,
    ): Boolean {
        if (!hasUsagePermission(context)) return false
        return isPackageInForeground(context, packageName, withinMs)
    }

    /**
     * Best-effort foreground package (MOVE_TO_FOREGROUND / RESUMED events, then lastTimeUsed).
     */
    fun getForegroundPackage(context: Context, withinMs: Long = 5_000L): String? {
        if (!hasUsagePermission(context)) return null

        val now = System.currentTimeMillis()
        val begin = now - withinMs.coerceAtLeast(1_000L)

        try {
            val usageStatsManager =
                context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val events = usageStatsManager.queryEvents(begin, now)
            val event = UsageEvents.Event()
            var lastForeground: String? = null
            var lastAt = 0L

            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                val type = event.eventType
                if (
                    type == UsageEvents.Event.ACTIVITY_RESUMED ||
                    type == UsageEvents.Event.MOVE_TO_FOREGROUND
                ) {
                    val pkg = event.packageName
                    if (!pkg.isNullOrBlank() && !isExcludedPackage(pkg)) {
                        if (event.timeStamp >= lastAt) {
                            lastAt = event.timeStamp
                            lastForeground = pkg
                        }
                    }
                }
            }

            if (lastForeground != null) return lastForeground
        } catch (_: Exception) {
            // fall through to lastTimeUsed
        }

        return try {
            val stats = queryTodayStats(context) ?: return null
            stats
                .filter { !isExcludedPackage(it.packageName) && it.lastTimeUsed > 0 }
                .maxByOrNull { it.lastTimeUsed }
                ?.takeIf { now - it.lastTimeUsed < withinMs }
                ?.packageName
        } catch (_: Exception) {
            null
        }
    }

    /** True when [packageName] is the app the user is actually viewing right now. */
    fun isPackageInForeground(
        context: Context,
        packageName: String,
        withinMs: Long = 5_000L,
    ): Boolean {
        if (packageName.isBlank()) return false
        if (!hasUsagePermission(context)) return false
        val foreground = getForegroundPackage(context, withinMs) ?: return false
        return foreground == packageName
    }

    /**
     * Whether an overlay may be shown for [packageName].
     * Without usage access we trust the accessibility window event that triggered intervention.
     */
    fun canShowOverlayForPackage(
        context: Context,
        packageName: String,
        withinMs: Long = 5_000L,
    ): Boolean {
        if (packageName.isBlank()) return false
        if (!hasUsagePermission(context)) return true
        return isPackageInForeground(context, packageName, withinMs)
    }

    private fun queryTodayStats(context: Context): List<android.app.usage.UsageStats>? {
        val usageStatsManager =
            context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val end = System.currentTimeMillis()
        val start = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis

        return usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            start,
            end,
        )
    }

    private fun isExcludedPackage(packageName: String): Boolean {
        if (packageName == "com.intentionalspace") return true
        if (packageName.startsWith("com.android.")) return true
        if (packageName.contains("launcher")) return true
        return false
    }
}
