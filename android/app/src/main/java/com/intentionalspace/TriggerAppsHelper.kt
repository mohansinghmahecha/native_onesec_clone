package com.intentionalspace

object TriggerAppsHelper {

    private val PACKAGE_TO_NAME = mapOf(
        "com.instagram.android" to "Instagram",
        "com.google.android.youtube" to "YouTube",
        "com.youtube.android" to "YouTube",
        "com.twitter.android" to "X/Twitter",
        "com.reddit.frontpage" to "Reddit",
        "com.facebook.katana" to "Facebook",
        "com.snapchat.android" to "Snapchat",
    )

    fun resolvePackage(packageName: String): String? =
        if (PACKAGE_TO_NAME.containsKey(packageName)) packageName else null

    fun getAppName(packageName: String): String =
        PACKAGE_TO_NAME[packageName] ?: BlockedAppsHelper.getAppName(packageName)
}
