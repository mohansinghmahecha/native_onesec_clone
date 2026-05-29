package com.intentionalspace

import android.content.Context
import java.util.Calendar

/**
 * Tracks intervention attempts and granted session minutes for the Overview screen.
 */
object DailyStatsStore {
    private const val PREFS_NAME = "IntentionalSpace"
    private const val KEY_STATS_DATE = "stats_date"
    private const val KEY_ATTEMPTS_TODAY = "attempts_today"
    private const val KEY_GRANTED_MINUTES_TODAY = "granted_minutes_today"

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun todayKey(): String {
        val c = Calendar.getInstance()
        return "${c.get(Calendar.YEAR)}-${c.get(Calendar.DAY_OF_YEAR)}"
    }

    private fun ensureToday(context: Context) {
        val today = todayKey()
        val prefs = prefs(context)
        if (prefs.getString(KEY_STATS_DATE, "") == today) return

        prefs.edit()
            .putString(KEY_STATS_DATE, today)
            .putInt(KEY_ATTEMPTS_TODAY, 0)
            .putInt(KEY_GRANTED_MINUTES_TODAY, 0)
            .apply()
    }

    fun recordAttempt(context: Context) {
        ensureToday(context)
        val prefs = prefs(context)
        prefs.edit()
            .putInt(KEY_ATTEMPTS_TODAY, prefs.getInt(KEY_ATTEMPTS_TODAY, 0) + 1)
            .apply()
    }

    fun recordGrantedMinutes(context: Context, minutes: Int) {
        if (minutes <= 0) return
        ensureToday(context)
        val prefs = prefs(context)
        prefs.edit()
            .putInt(
                KEY_GRANTED_MINUTES_TODAY,
                prefs.getInt(KEY_GRANTED_MINUTES_TODAY, 0) + minutes,
            )
            .apply()
    }

    fun getAttemptsToday(context: Context): Int {
        ensureToday(context)
        return prefs(context).getInt(KEY_ATTEMPTS_TODAY, 0)
    }

    fun getGrantedMinutesToday(context: Context): Int {
        ensureToday(context)
        return prefs(context).getInt(KEY_GRANTED_MINUTES_TODAY, 0)
    }
}
