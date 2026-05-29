package com.intentionalspace

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log

/**
 * Re-blocks the app when a temporary unlock session expires, even if the user
 * is still inside the app (no new window event would fire otherwise).
 */
object UnlockExpiryScheduler {
    private const val TAG = "IntentionalSpace"

    private val handler = Handler(Looper.getMainLooper())
    private val pending = mutableMapOf<String, Runnable>()

    fun schedule(context: Context, packageName: String, minutes: Int) {
        if (packageName.isBlank() || minutes <= 0) return

        cancel(packageName)
        val appContext = context.applicationContext
        val appName = BlockedAppsHelper.getAppName(packageName)

        val runnable = Runnable {
            pending.remove(packageName)
            if (UnlockStateStore.isUnlocked(appContext, packageName)) {
                // Expiry timestamp passed but store not yet cleared
                UnlockStateStore.clearUnlock(appContext, packageName)
            }
            AccessibilityService.clearUnlockCooldown(packageName)

            if (!BlockedAppsHelper.isBlocked(appContext, packageName)) return@Runnable
            if (!BlockedAppsHelper.shouldIntervene(appContext, packageName)) return@Runnable

            Log.d(TAG, "⏰ Session ended — showing in-app re-block for $appName")
            AccessibilityService.requestReblock(appContext, packageName, appName)
        }

        pending[packageName] = runnable
        handler.postDelayed(runnable, minutes * 60_000L)
        Log.d(TAG, "⏱️ Re-block scheduled for $appName in $minutes min")
    }

    fun cancel(packageName: String) {
        pending.remove(packageName)?.let { handler.removeCallbacks(it) }
    }
}
