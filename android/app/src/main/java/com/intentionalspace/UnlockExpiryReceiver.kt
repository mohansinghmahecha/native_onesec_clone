package com.intentionalspace

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * AlarmManager fires this when a session unlock expires (works in background / Doze).
 */
class UnlockExpiryReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val packageName = intent?.getStringExtra(EXTRA_PACKAGE) ?: return
        UnlockExpiryScheduler.onUnlockExpired(context.applicationContext, packageName)
    }

    companion object {
        const val ACTION = "com.intentionalspace.UNLOCK_EXPIRED"
        const val EXTRA_PACKAGE = "package_name"
    }
}
