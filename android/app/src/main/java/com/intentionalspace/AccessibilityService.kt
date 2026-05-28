package com.intentionalspace

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class AccessibilityService : AccessibilityService() {
    
    companion object {
        private const val TAG = "IntentionalSpace"
        var isServiceRunning = false
        
        // List of apps to monitor (package names)
        val TRIGGER_APPS = setOf(
            "com.instagram.android",      // Instagram
            "com.google.android.youtube", // YouTube
            "com.twitter.android",        // Twitter/X
            "com.reddit.frontpage",       // Reddit
            "com.facebook.katana",        // Facebook
            "com.snapchat.android"        // Snapchat
        )
    }
    
    override fun onServiceConnected() {
        super.onServiceConnected()
        isServiceRunning = true
        Log.d(TAG, "✅ Accessibility Service Connected")
        
        // Configure the accessibility service
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 100
        }
        setServiceInfo(info)
    }
    
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event?.let {
            if (it.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
                val packageName = it.packageName?.toString() ?: return
                
                // Check if opened app is in our trigger list
                if (TRIGGER_APPS.contains(packageName)) {
                    Log.d(TAG, "🔴 Blocked app detected: $packageName")
                    showInterventionOverlay(packageName)
                }
            }
        }
    }
    
    private fun showInterventionOverlay(packageName: String) {
        try {
            val intent = Intent(this, OverlayService::class.java).apply {
                putExtra("package_name", packageName)
            }
            startService(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error starting overlay service: ${e.message}")
        }
    }
    
    override fun onInterrupt() {
        isServiceRunning = false
        Log.d(TAG, "⚠️ Accessibility Service Interrupted")
    }
    
    override fun onDestroy() {
        super.onDestroy()
        isServiceRunning = false
        Log.d(TAG, "🛑 Accessibility Service Destroyed")
    }
}