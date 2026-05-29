package com.intentionalspace

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments

class PendingAppModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PendingAppModule"

    @ReactMethod
    fun getPendingApp(promise: Promise) {
        try {
            val map = Arguments.createMap()
            val packageName = MainActivity.pendingAppPackage
            if (!packageName.isNullOrBlank()) {
                map.putString("packageName", packageName)
                map.putString("appName", MainActivity.pendingAppName)
                map.putBoolean("showIntervention", MainActivity.pendingShowIntervention)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun clearPendingIntervention(promise: Promise) {
        try {
            MainActivity.clearPendingIntervention()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}