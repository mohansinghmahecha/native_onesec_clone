package com.intentionalspace

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

    companion object {
        @JvmField
        var pendingAppPackage: String? = null

        @JvmField
        var pendingAppName: String? = null

        @JvmField
        var pendingShowIntervention: Boolean = false

        fun clearPendingIntervention() {
            pendingAppPackage = null
            pendingAppName = null
            pendingShowIntervention = false
        }
    }
    
    private val unlockReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "APP_UNLOCKED") {
                val packageName = intent.getStringExtra("packageName") ?: return
                val appName = intent.getStringExtra("appName") ?: return
                val minutes = intent.getIntExtra("minutes", 0)
                
                // Send to React Native
                sendEventToReactNative("APP_UNLOCKED", mapOf(
                    "packageName" to packageName,
                    "appName" to appName,
                    "minutes" to minutes
                ))
            }
        }
    }
    
    override fun getMainComponentName(): String = "IntentionalSpace"
    
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleLaunchIntent(intent)

        // Fix: Add RECEIVER_EXPORTED flag for Android 14+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(unlockReceiver, IntentFilter("APP_UNLOCKED"), Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(unlockReceiver, IntentFilter("APP_UNLOCKED"))
        }
    }
    
    override fun onResume() {
        super.onResume()
        if (pendingShowIntervention && !pendingAppPackage.isNullOrBlank()) {
            emitInterventionRequired(
                pendingAppPackage!!,
                pendingAppName ?: BlockedAppsHelper.getAppName(pendingAppPackage!!),
            )
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        if (intent != null) {
            setIntent(intent)
            handleLaunchIntent(intent)
        }
    }

    private fun handleLaunchIntent(intent: Intent?) {
        val packageName = intent?.getStringExtra("packageName")
            ?: intent?.getStringExtra("package_name")
        val appName = intent?.getStringExtra("appName")
            ?: intent?.getStringExtra("app_name")
            ?: packageName?.let { BlockedAppsHelper.getAppName(it) }
        val showIntervention = intent?.getBooleanExtra("showIntervention", false) == true

        if (!packageName.isNullOrBlank()) {
            pendingAppPackage = packageName
            pendingAppName = appName ?: BlockedAppsHelper.getAppName(packageName)
            pendingShowIntervention = showIntervention

            if (showIntervention) {
                emitInterventionRequired(packageName, pendingAppName ?: "App")
            }
        }
    }

    private fun emitInterventionRequired(packageName: String, appName: String) {
        val payload = mapOf(
            "packageName" to packageName,
            "appName" to appName,
        )
        if (sendEventToReactNative("INTERVENTION_REQUIRED", payload)) {
            return
        }
        // React may not be ready yet when activity is cold-started from accessibility
        val handler = Handler(Looper.getMainLooper())
        var attempts = 0
        val retry = object : Runnable {
            override fun run() {
                attempts++
                if (sendEventToReactNative("INTERVENTION_REQUIRED", payload) || attempts >= 20) {
                    return
                }
                handler.postDelayed(this, 250)
            }
        }
        handler.postDelayed(retry, 250)
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(unlockReceiver)
        } catch (e: Exception) {
            // Receiver already unregistered
        }
    }
    
    private fun sendEventToReactNative(eventName: String, params: Map<String, Any>): Boolean {
        return try {
            val arguments = com.facebook.react.bridge.Arguments.createMap()
            params.forEach { (key, value) ->
                when (value) {
                    is String -> arguments.putString(key, value)
                    is Int -> arguments.putInt(key, value)
                    is Boolean -> arguments.putBoolean(key, value)
                }
            }
            val emitter = reactInstanceManager?.currentReactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            if (emitter == null) {
                false
            } else {
                emitter.emit(eventName, arguments)
                true
            }
        } catch (e: Exception) {
            false
        }
    }
}