package com.intentionalspace

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log

object InterventionLauncher {
    private const val TAG = "IntentionalSpace"
    private const val OVERLAY_DELAY_MS = 200L
    private val mainHandler = Handler(Looper.getMainLooper())

    fun launch(context: Context, packageName: String, appName: String) {
        AccessibilityService.clearExitCooldown(packageName)
        showInAppOverlay(context, packageName, appName, recordAttempt = true)
    }

    fun showReblockOverlay(context: Context, packageName: String, appName: String) {
        showInAppOverlay(context, packageName, appName, recordAttempt = false)
    }

    private fun showInAppOverlay(
        context: Context,
        packageName: String,
        appName: String,
        recordAttempt: Boolean,
    ) {
        if (UnlockStateStore.isUnlocked(context, packageName)) {
            AccessibilityService.clearInterventionInFlight()
            return
        }

        if (OverlayService.isOverlayVisible) {
            AccessibilityService.clearInterventionInFlight()
            return
        }

        if (recordAttempt) {
            DailyStatsStore.recordAttempt(context.applicationContext)
        }

        MainActivity.pendingAppPackage = packageName
        MainActivity.pendingAppName = appName
        MainActivity.pendingShowIntervention = false

        val appContext = context.applicationContext
        mainHandler.postDelayed({
            try {
                if (OverlayService.isOverlayVisible) {
                    AccessibilityService.clearInterventionInFlight()
                    return@postDelayed
                }

                if (OverlayPermissionHelper.canDrawOverlays(appContext)) {
                    appContext.startService(
                        Intent(appContext, OverlayService::class.java).apply {
                            putExtra("package_name", packageName)
                            putExtra("app_name", appName)
                        },
                    )
                } else {
                    launchMainActivity(appContext, packageName, appName)
                    AccessibilityService.clearInterventionInFlight()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Overlay launch failed: ${e.message}")
                AccessibilityService.clearInterventionInFlight()
            }
        }, OVERLAY_DELAY_MS)
    }

    fun isAccessibilityEnabled(context: Context): Boolean {
        val enabled = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
        ) ?: return false
        val colon = "${context.packageName}:"
        val slash = "${context.packageName}/"
        return enabled.contains(colon) || enabled.contains(slash)
    }

    private fun launchMainActivity(context: Context, packageName: String, appName: String) {
        try {
            context.startActivity(
                Intent(context, MainActivity::class.java).apply {
                    addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK or
                            Intent.FLAG_ACTIVITY_CLEAR_TOP or
                            Intent.FLAG_ACTIVITY_SINGLE_TOP,
                    )
                    putExtra("packageName", packageName)
                    putExtra("appName", appName)
                    putExtra("showIntervention", true)
                },
            )
        } catch (e: Exception) {
            Log.e(TAG, "MainActivity launch failed: ${e.message}")
        }
    }
}
