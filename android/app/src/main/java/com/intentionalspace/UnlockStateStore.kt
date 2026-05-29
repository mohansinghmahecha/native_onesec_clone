package com.intentionalspace

import android.content.Context
import android.content.SharedPreferences
import java.util.concurrent.ConcurrentHashMap

/**
 * Persists short-term app unlocks from the overlay so the accessibility service
 * does not re-show the intervention on every in-app window change.
 */
object UnlockStateStore {
    private const val PREFS_NAME = "IntentionalSpace"
    private const val KEY_PREFIX = "unlock_expiry_"

    /** In-memory expiry so accessibility sees unlock before disk flush. */
    private val memoryExpiryMs = ConcurrentHashMap<String, Long>()

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun grantUnlock(context: Context, packageName: String, minutes: Int) {
        if (packageName.isBlank() || minutes <= 0) return
        val expiryMs = System.currentTimeMillis() + minutes * 60_000L
        memoryExpiryMs[packageName] = expiryMs
        prefs(context).edit().putLong(key(packageName), expiryMs).commit()
        UnlockExpiryScheduler.schedule(context, packageName, minutes)
        DailyStatsStore.recordGrantedMinutes(context, minutes)
    }

    fun isUnlocked(context: Context, packageName: String): Boolean {
        if (packageName.isBlank()) return false

        val now = System.currentTimeMillis()
        val memExpiry = memoryExpiryMs[packageName]
        if (memExpiry != null) {
            if (memExpiry > now) return true
            memoryExpiryMs.remove(packageName)
        }

        val expiryMs = prefs(context).getLong(key(packageName), 0L)
        if (expiryMs <= 0L) return false
        if (expiryMs > now) {
            memoryExpiryMs[packageName] = expiryMs
            return true
        }
        memoryExpiryMs.remove(packageName)
        prefs(context).edit().remove(key(packageName)).apply()
        return false
    }

    fun clearUnlock(context: Context, packageName: String) {
        if (packageName.isBlank()) return
        UnlockExpiryScheduler.cancel(packageName)
        memoryExpiryMs.remove(packageName)
        prefs(context).edit().remove(key(packageName)).commit()
    }

    fun remainingMinutes(context: Context, packageName: String): Int {
        val expiryMs = memoryExpiryMs[packageName]
            ?: prefs(context).getLong(key(packageName), 0L)
        if (expiryMs <= System.currentTimeMillis()) return 0
        return ((expiryMs - System.currentTimeMillis()) / 60_000L).toInt().coerceAtLeast(1)
    }

    private fun key(packageName: String) = KEY_PREFIX + packageName
}
