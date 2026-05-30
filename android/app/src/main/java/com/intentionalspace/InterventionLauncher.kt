package com.intentionalspace

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log

object InterventionLauncher {
    private const val TAG = "IntentionalSpace"
    private val mainHandler = Handler(Looper.getMainLooper())
    private val pendingRunnables = mutableMapOf<String, Runnable>()

    fun cancelPendingOverlay(packageName: String) {
        pendingRunnables.remove(packageName)?.let { mainHandler.removeCallbacks(it) }
    }

    fun cancelAllPendingOverlays() {
        pendingRunnables.keys.toList().forEach { cancelPendingOverlay(it) }
    }

    fun showOverlay(
        context: Context,
        packageName: String,
        appName: String,
        isReblock: Boolean = false,
    ) {
        if (UnlockStateStore.isUnlocked(context, packageName)) {
            AccessibilityService.clearInterventionInFlight()
            return
        }

        if (OverlayService.isOverlayVisible) {
            AccessibilityService.clearInterventionInFlight()
            return
        }

        if (!isReblock) {
            DailyStatsStore.recordAttempt(context.applicationContext)
            AccessibilityService.clearExitCooldown(packageName)
        }

        MainActivity.pendingAppPackage = null
        MainActivity.pendingAppName = null
        MainActivity.pendingShowIntervention = false

        val appContext = context.applicationContext
        cancelPendingOverlay(packageName)

        val runnable = Runnable {
            pendingRunnables.remove(packageName)
            try {
                if (UnlockStateStore.isUnlocked(appContext, packageName)) {
                    AccessibilityService.clearInterventionInFlight()
                    return@Runnable
                }
                if (OverlayService.isOverlayVisible) {
                    AccessibilityService.clearInterventionInFlight()
                    return@Runnable
                }

                val activeWindow = try {
                    AccessibilityService.getServiceInstance()
                        ?.rootInActiveWindow?.packageName?.toString()
                } catch (_: Exception) {
                    null
                }
                if (
                    activeWindow != null &&
                    activeWindow != packageName &&
                    activeWindow != appContext.packageName
                ) {
                    Log.d(TAG, "Skip overlay — active window is $activeWindow not $packageName")
                    AccessibilityService.clearInterventionInFlight()
                    return@Runnable
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
        }

        pendingRunnables[packageName] = runnable
        mainHandler.postDelayed(runnable, 150L)
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
