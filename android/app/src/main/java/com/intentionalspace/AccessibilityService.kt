package com.intentionalspace

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class AccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "IntentionalSpace"
        var isServiceRunning = false

        @Volatile
        private var instance: AccessibilityService? = null

        private var lastInterventionPackage: String? = null
        private var lastInterventionAt: Long = 0L
        private const val INTERVENTION_DEBOUNCE_MS = 4_000L

        /** Throttle expensive checks — WINDOW_STATE_CHANGED only, but still debounced. */
        private var lastProbePackage: String? = null
        private var lastProbeAt: Long = 0L
        private const val PROBE_INTERVAL_MS = 1_000L

        private const val POST_UNLOCK_GRACE_MS = 5_000L
        private val unlockCooldownUntilMs = mutableMapOf<String, Long>()

        /** After exit/auto-exit, ignore brief window events during HOME transition. */
        private const val POST_EXIT_GRACE_MS = 3_000L
        private val exitCooldownUntilMs = mutableMapOf<String, Long>()

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
                System.currentTimeMillis() + POST_EXIT_GRACE_MS
        }

        fun clearExitCooldown(packageName: String) {
            exitCooldownUntilMs.remove(packageName)
        }

        fun resetInterventionDebounce(packageName: String) {
            if (lastInterventionPackage == packageName) {
                lastInterventionPackage = null
                lastInterventionAt = 0L
            }
        }

        fun clearInterventionInFlight() {
            interventionInFlight = false
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

        fun getServiceInstance(): AccessibilityService? = instance

        fun requestReblock(context: Context, packageName: String, appName: String) {
            InterventionLauncher.showReblockOverlay(context, packageName, appName)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        isServiceRunning = true
        Log.d(TAG, "Accessibility service connected")

        val info = AccessibilityServiceInfo().apply {
            // CONTENT_CHANGED caused hundreds of events/sec in YouTube → hang/black loop
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 300
        }
        setServiceInfo(info)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val packageName = event.packageName?.toString() ?: return
        maybeIntervene(packageName)
    }

    private fun maybeIntervene(packageName: String) {
        if (TriggerAppsHelper.resolvePackage(packageName) == null) return

        val now = System.currentTimeMillis()
        if (packageName == lastProbePackage && now - lastProbeAt < PROBE_INTERVAL_MS) {
            return
        }
        lastProbePackage = packageName
        lastProbeAt = now

        if (UnlockStateStore.isUnlocked(this, packageName)) return
        if (isInUnlockCooldown(packageName)) return
        if (isInExitCooldown(packageName)) return
        if (interventionInFlight || OverlayService.isOverlayVisible) return

        if (
            packageName == lastInterventionPackage &&
            now - lastInterventionAt < INTERVENTION_DEBOUNCE_MS
        ) {
            return
        }

        if (!BlockedAppsHelper.shouldIntervene(this, packageName)) return

        val appName = TriggerAppsHelper.getAppName(packageName)
        Log.d(TAG, "Intervention: $appName")
        lastInterventionPackage = packageName
        lastInterventionAt = now
        interventionInFlight = true
        InterventionLauncher.launch(this, packageName, appName)
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
