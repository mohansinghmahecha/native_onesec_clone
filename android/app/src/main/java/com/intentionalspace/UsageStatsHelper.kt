package com.intentionalspace

import android.app.AppOpsManager
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
        if (!hasUsagePermission(context)) return true

        return try {
            val stats = queryTodayStats(context) ?: return true
            val now = System.currentTimeMillis()
            val recent = stats
                .filter { !isExcludedPackage(it.packageName) && it.lastTimeUsed > 0 }
                .maxByOrNull { it.lastTimeUsed }
            recent != null &&
                recent.packageName == packageName &&
                now - recent.lastTimeUsed < withinMs
        } catch (_: Exception) {
            true
        }
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
