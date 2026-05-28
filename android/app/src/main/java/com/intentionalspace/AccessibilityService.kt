package com.intentionalspace

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class AccessibilityService : AccessibilityService() {
    
    companion object {
        private const val TAG = "IntentionalSpace"
        var isServiceRunning = false
        
        val TRIGGER_APPS = mapOf(
            "com.instagram.android" to "Instagram",
            "com.google.android.youtube" to "YouTube",
            "com.twitter.android" to "X/Twitter",
            "com.reddit.frontpage" to "Reddit",
            "com.facebook.katana" to "Facebook",
            "com.snapchat.android" to "Snapchat"
        )
    }
    
    private lateinit var sharedPreferences: SharedPreferences
    
    override fun onCreate() {
        super.onCreate()
        sharedPreferences = getSharedPreferences("IntentionalSpace", Context.MODE_PRIVATE)
    }
    
    override fun onServiceConnected() {
        super.onServiceConnected()
        isServiceRunning = true
        Log.d(TAG, "✅ Accessibility Service Connected")
        
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
                
                if (TRIGGER_APPS.containsKey(packageName)) {
                    val appName = TRIGGER_APPS[packageName] ?: return
                    
                    if (isAppBlocked(packageName)) {
                        Log.d(TAG, "🔴 Blocked app detected: $appName")
                        showInterventionOverlay(packageName, appName)
                    } else {
                        Log.d(TAG, "✅ App not blocked: $appName")
                    }
                }
            }
        }
    }
    
    private fun isAppBlocked(packageName: String): Boolean {
        val blockedAppsJson = sharedPreferences.getString("blocked_apps", null)
        if (blockedAppsJson != null) {
            return blockedAppsJson.contains(packageName) && 
                   !blockedAppsJson.contains("\"$packageName\":false")
        }
        return packageName == "com.instagram.android" || 
               packageName == "com.google.android.youtube"
    }
    
    private fun showInterventionOverlay(packageName: String, appName: String) {
        try {
            val intent = Intent(this, OverlayService::class.java).apply {
                putExtra("package_name", packageName)
                putExtra("app_name", appName)
            }
            startService(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error starting overlay: ${e.message}")
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