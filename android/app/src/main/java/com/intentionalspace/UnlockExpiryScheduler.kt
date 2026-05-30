package com.intentionalspace

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log

/**
 * Re-blocks when a temporary unlock expires. Uses AlarmManager (reliable in background)
 * plus a Handler fallback while the process is alive.
 */
object UnlockExpiryScheduler {
    private const val TAG = "IntentionalSpace"

    private val handler = Handler(Looper.getMainLooper())
    private val handlerFallback = mutableMapOf<String, Runnable>()

    fun schedule(context: Context, packageName: String, minutes: Int) {
        if (packageName.isBlank() || minutes <= 0) return

        cancel(packageName)
        val appContext = context.applicationContext
        val expiryMs = System.currentTimeMillis() + minutes * 60_000L

        scheduleAlarm(appContext, packageName, expiryMs)

        val fallback = Runnable {
            handlerFallback.remove(packageName)
            if (!UnlockStateStore.isUnlocked(appContext, packageName)) {
                onUnlockExpired(appContext, packageName)
            }
        }
        handlerFallback[packageName] = fallback
        handler.postDelayed(fallback, minutes * 60_000L)
        Log.d(TAG, "⏱️ Re-block scheduled for ${BlockedAppsHelper.getAppName(packageName)} in $minutes min")
    }

    fun cancel(packageName: String) {
        handlerFallback.remove(packageName)?.let { handler.removeCallbacks(it) }
    }

    /** After reboot / process death, re-arm alarms from persisted unlock expiry times. */
    fun restoreSchedules(context: Context) {
        val appContext = context.applicationContext
        val prefs = appContext.getSharedPreferences("IntentionalSpace", Context.MODE_PRIVATE)
        val now = System.currentTimeMillis()
        val prefix = "unlock_expiry_"

        for ((key, value) in prefs.all) {
            if (!key.startsWith(prefix) || value !is Long) continue
            val packageName = key.removePrefix(prefix)
            if (packageName.isBlank()) continue
            val expiryMs = value
            if (expiryMs > now) {
                cancel(packageName)
                cancelAlarm(appContext, packageName)
                scheduleAlarm(appContext, packageName, expiryMs)
                val remainingMs = expiryMs - now
                val fallback = Runnable {
                    handlerFallback.remove(packageName)
                    if (!UnlockStateStore.isUnlocked(appContext, packageName)) {
                        onUnlockExpired(appContext, packageName)
                    }
                }
                handlerFallback[packageName] = fallback
                handler.postDelayed(fallback, remainingMs)
            } else {
                UnlockStateStore.clearUnlock(appContext, packageName)
                AccessibilityService.markPendingReblock(packageName)
            }
        }
    }

    fun cancelAlarm(context: Context, packageName: String) {
        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.cancel(buildPendingIntent(context, packageName))
        } catch (_: Exception) {
        }
    }

    /** Called from AlarmManager, Handler fallback, or JS when session ends. */
    fun onUnlockExpired(context: Context, packageName: String) {
        val appContext = context.applicationContext
        val appName = BlockedAppsHelper.getAppName(packageName)

        UnlockStateStore.clearUnlock(appContext, packageName)

        AccessibilityService.clearUnlockCooldown(packageName)
        AccessibilityService.clearExitCooldown(packageName)
        AccessibilityService.resetInterventionDebounce(packageName)

        if (!BlockedAppsHelper.isBlocked(appContext, packageName)) {
            Log.d(TAG, "⏰ $appName not blocked — skip re-block")
            return
        }
        if (!BlockedAppsHelper.shouldIntervene(appContext, packageName)) {
            Log.d(TAG, "⏰ $appName shouldIntervene=false — skip re-block")
            return
        }

        val svc = AccessibilityService.getServiceInstance()
        val foreground = try {
            svc?.rootInActiveWindow?.packageName?.toString()
        } catch (_: Exception) {
            null
        }
        val inApp = foreground == packageName

        if (inApp) {
            Log.d(TAG, "⏰ Session ended — re-block $appName")
            AccessibilityService.requestReblock(appContext, packageName, appName)
        } else {
            Log.d(TAG, "⏰ Session ended — pending re-block $appName")
            AccessibilityService.markPendingReblock(packageName)
        }
    }

    private fun scheduleAlarm(context: Context, packageName: String, expiryMs: Long) {
        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val pending = buildPendingIntent(context, packageName)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    expiryMs,
                    pending,
                )
            } else {
                @Suppress("DEPRECATION")
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, expiryMs, pending)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Alarm schedule failed: ${e.message}")
        }
    }

    private fun buildPendingIntent(context: Context, packageName: String): PendingIntent {
        val intent = Intent(context, UnlockExpiryReceiver::class.java).apply {
            action = UnlockExpiryReceiver.ACTION
            putExtra(UnlockExpiryReceiver.EXTRA_PACKAGE, packageName)
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_IMMUTABLE
            } else {
                0
            }
        return PendingIntent.getBroadcast(
            context,
            packageName.hashCode(),
            intent,
            flags,
        )
    }
}
