package com.intentionalspace

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {
    
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
        
        // Fix: Add RECEIVER_EXPORTED flag for Android 14+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(unlockReceiver, IntentFilter("APP_UNLOCKED"), Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(unlockReceiver, IntentFilter("APP_UNLOCKED"))
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(unlockReceiver)
        } catch (e: Exception) {
            // Receiver already unregistered
        }
    }
    
    private fun sendEventToReactNative(eventName: String, params: Map<String, Any>) {
        try {
            val arguments = com.facebook.react.bridge.Arguments.createMap()
            params.forEach { (key, value) ->
                when (value) {
                    is String -> arguments.putString(key, value)
                    is Int -> arguments.putInt(key, value)
                    is Boolean -> arguments.putBoolean(key, value)
                }
            }
            reactInstanceManager?.currentReactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, arguments)
        } catch (e: Exception) {
            // Ignore
        }
    }
}