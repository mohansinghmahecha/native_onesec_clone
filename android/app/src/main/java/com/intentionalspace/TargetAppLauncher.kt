package com.intentionalspace

import android.content.Context
import android.content.Intent
import android.util.Log

object TargetAppLauncher {
    private const val TAG = "IntentionalSpace"

    fun launch(context: Context, packageName: String): Boolean {
        if (packageName.isBlank()) return false

        return try {
            val launchIntent =
                context.packageManager.getLaunchIntentForPackage(packageName)
                    ?: run {
                        Log.w(TAG, "No launch intent for $packageName")
                        return false
                    }

            launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED,
            )
            context.startActivity(launchIntent)
            Log.d(TAG, "▶️ Launched $packageName after unlock")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch $packageName: ${e.message}")
            false
        }
    }

    /** Leave the blocked app without granting session time. */
    fun exitApp(context: Context, packageName: String) {
        val svc = AccessibilityService.getServiceInstance()
        if (svc != null) {
            svc.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME)
            Log.d(TAG, "🚪 Exited $packageName (accessibility home)")
            return
        }

        try {
            context.startActivity(
                Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                },
            )
            Log.d(TAG, "🚪 Exited $packageName (home intent)")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to exit $packageName: ${e.message}")
        }
    }
}
