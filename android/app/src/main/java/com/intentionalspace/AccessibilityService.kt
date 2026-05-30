package com.intentionalspace

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import java.util.concurrent.ConcurrentHashMap

class AccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "IntentionalSpace"
        var isServiceRunning = false

        @Volatile
        private var instance: AccessibilityService? = null

        private var lastInterventionPackage: String? = null
        private var lastInterventionAt: Long = 0L
        private const val INTERVENTION_DEBOUNCE_MS = 800L

        private const val POST_UNLOCK_GRACE_MS = 3_000L
        private val unlockCooldownUntilMs = mutableMapOf<String, Long>()

        /** Brief pause after user taps Exit (blocks ghost overlays on HOME). */
        private const val POST_EXIT_MS = 2_500L
        private val exitCooldownUntilMs = mutableMapOf<String, Long>()

        /** Session ended while user was away — show block modal on next app open. */
        private val pendingReblockPackages = ConcurrentHashMap.newKeySet<String>()

        @Volatile
        var interventionInFlight: Boolean = false

        fun markUnlockCooldown(packageName: String) {
            unlockCooldownUntilMs[packageName] =
                System.currentTimeMillis() + POST_UNLOCK_GRACE_MS
        }

        fun clearUnlockCooldown(packageName: String) {
            unlockCooldownUntilMs.remove(packageName)
        }

        fun markExitCooldown(packageName: String) {
            exitCooldownUntilMs[packageName] =
                System.currentTimeMillis() + POST_EXIT_MS
        }

        fun clearExitCooldown(packageName: String) {
            exitCooldownUntilMs.remove(packageName)
        }

        fun markPendingReblock(packageName: String) {
            if (packageName.isNotBlank()) pendingReblockPackages.add(packageName)
        }

        fun consumePendingReblock(packageName: String): Boolean =
            pendingReblockPackages.remove(packageName)

        fun resetInterventionDebounce(packageName: String) {
            if (lastInterventionPackage == packageName) {
                lastInterventionPackage = null
                lastInterventionAt = 0L
            }
        }

        fun clearInterventionInFlight() {
            interventionInFlight = false
        }

        fun getServiceInstance(): AccessibilityService? = instance

        fun requestReblock(context: Context, packageName: String, appName: String) {
            InterventionLauncher.showOverlay(context, packageName, appName, isReblock = true)
        }

        private fun isInExitCooldown(packageName: String): Boolean {
            val until = exitCooldownUntilMs[packageName] ?: return false
            if (until > System.currentTimeMillis()) return true
            exitCooldownUntilMs.remove(packageName)
            return false
        }

        private fun isInUnlockCooldown(packageName: String): Boolean {
            val until = unlockCooldownUntilMs[packageName] ?: return false
            if (until > System.currentTimeMillis()) return true
            unlockCooldownUntilMs.remove(packageName)
            return false
        }

    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        isServiceRunning = true
        Log.d(TAG, "Accessibility service connected")

        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 100
        }
        setServiceInfo(info)
        UnlockExpiryScheduler.restoreSchedules(this)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val packageName = event.packageName?.toString() ?: return

        handleForegroundChange(packageName)

        if (TriggerAppsHelper.resolvePackage(packageName) != null) {
            maybeIntervene(packageName)
        }
    }

    /**
     * Accessibility told us the active window changed — hide overlay if user left the blocked app.
     */
    private fun handleForegroundChange(foregroundPackage: String) {
        if (!OverlayService.isOverlayVisible) return

        val overlayTarget = OverlayService.currentOverlayPackage ?: return

        if (foregroundPackage == overlayTarget) return
        if (foregroundPackage == applicationContext.packageName) return

        Log.d(TAG, "Dismiss overlay: left $overlayTarget, now on $foregroundPackage")
        InterventionLauncher.cancelAllPendingOverlays()
        OverlayService.dismissStaleOverlay(this)
    }

    private fun maybeIntervene(packageName: String) {
        val now = System.currentTimeMillis()

        if (UnlockStateStore.isUnlocked(this, packageName)) return

        val needsReblock = consumePendingReblock(packageName)
        if (!needsReblock) {
            if (isInUnlockCooldown(packageName)) return
            if (isInExitCooldown(packageName)) return
            if (
                packageName == lastInterventionPackage &&
                now - lastInterventionAt < INTERVENTION_DEBOUNCE_MS
            ) {
                return
            }
        } else {
            clearExitCooldown(packageName)
            resetInterventionDebounce(packageName)
        }

        if (interventionInFlight || OverlayService.isOverlayVisible) return
        if (!BlockedAppsHelper.shouldIntervene(this, packageName)) return

        val appName = TriggerAppsHelper.getAppName(packageName)
        Log.d(TAG, "Intervention: $appName")
        lastInterventionPackage = packageName
        lastInterventionAt = now
        interventionInFlight = true
        InterventionLauncher.showOverlay(this, packageName, appName, isReblock = needsReblock)
    }

    override fun onInterrupt() {
        isServiceRunning = false
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance === this) instance = null
        isServiceRunning = false
        interventionInFlight = false
    }
}
