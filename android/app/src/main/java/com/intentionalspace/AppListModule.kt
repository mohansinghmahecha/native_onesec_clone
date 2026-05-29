package com.intentionalspace

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.util.Log
import com.facebook.react.bridge.*
import kotlin.collections.ArrayList

class AppListModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppListModule"

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            
            val appList = ArrayList<AppInfo>()
            
            for (appInfo in packages) {
                // Skip our own app
                if (appInfo.packageName == "com.intentionalspace") {
                    continue
                }
                
                val app = AppInfo().apply {
                    packageName = appInfo.packageName
                    appName = pm.getApplicationLabel(appInfo).toString()
                    isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                }
                
                appList.add(app)
            }
            
            // Sort by app name
            appList.sortBy { it.appName.lowercase() }
            
            val result = Arguments.createArray()
            for (app in appList) {
                val map = Arguments.createMap()
                map.putString("packageName", app.packageName)
                map.putString("appName", app.appName)
                map.putBoolean("isSystemApp", app.isSystemApp)
                result.pushMap(map)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e("AppListModule", "Error getting installed apps: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }
    
    data class AppInfo(
        var packageName: String = "",
        var appName: String = "",
        var isSystemApp: Boolean = false
    )
}