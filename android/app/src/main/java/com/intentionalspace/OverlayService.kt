package com.intentionalspace

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat

class OverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private val handler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null
    private var autoExitRunnable: Runnable? = null
    private var overlaySessionId: Long = 0L

    companion object {
        private const val TAG = "IntentionalSpace"
        private const val CHANNEL_ID = "intentional_space_overlay"
        private const val NOTIFICATION_ID = 999
        private const val AUTO_EXIT_MS = 15_000L

        @JvmField
        var isOverlayVisible: Boolean = false

        @JvmField
        var currentOverlayPackage: String? = null

        @Volatile
        private var runningInstance: OverlayService? = null

        fun buildTimeOptions(sessionMinutes: Int): List<Int> {
            val primary = sessionMinutes.coerceIn(1, 480)
            val extras = listOf(1, 5, 10, 15, 30).filter { it != primary }
            return listOf(primary, extras[0], extras[1])
        }

        fun dismissStaleOverlay(context: Context) {
            val live = runningInstance
            if (live != null) {
                live.handler.post { live.dismissOverlayOnly() }
                return
            }
            try {
                context.applicationContext.startService(
                    Intent(context.applicationContext, OverlayService::class.java).apply {
                        putExtra("action", "dismiss_stale")
                    },
                )
            } catch (_: Exception) {
                isOverlayVisible = false
                currentOverlayPackage = null
                AccessibilityService.clearInterventionInFlight()
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        runningInstance = this
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.getStringExtra("action") == "dismiss_stale") {
            dismissOverlayOnly()
            stopSelf()
            return START_NOT_STICKY
        }

        val packageName = intent?.getStringExtra("package_name") ?: ""
        val appName = intent?.getStringExtra("app_name") ?: "App"

        if (packageName.isBlank()) {
            AccessibilityService.clearInterventionInFlight()
            stopSelf()
            return START_NOT_STICKY
        }

        if (
            UnlockStateStore.isUnlocked(this, packageName) &&
            !BlockedAppsHelper.isDailyLimitExceeded(this, packageName)
        ) {
            AccessibilityService.clearInterventionInFlight()
            stopSelf()
            return START_NOT_STICKY
        }

        if (isOverlayVisible && currentOverlayPackage == packageName) {
            AccessibilityService.clearInterventionInFlight()
            return START_NOT_STICKY
        }

        if (isOverlayVisible) {
            dismissOverlayOnly()
        }

        showInterventionUI(packageName, appName)
        return START_NOT_STICKY
    }

    private fun showInterventionUI(packageName: String, appName: String) {
        val sessionId = System.nanoTime()
        overlaySessionId = sessionId

        try {
            removeOverlay(keepServiceAlive = true)
            val inflater = getSystemService(LAYOUT_INFLATER_SERVICE) as LayoutInflater
            overlayView = inflater.inflate(R.layout.overlay_intervention, null)

            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    WindowManager.LayoutParams.TYPE_PHONE
                },
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT,
            )
            params.gravity = Gravity.TOP or Gravity.START

            val appNameText = overlayView?.findViewById<TextView>(R.id.app_name_text)
            val breathInstruction = overlayView?.findViewById<TextView>(R.id.breath_instruction)
            val timerText = overlayView?.findViewById<TextView>(R.id.timer_text)
            val oneMinButton = overlayView?.findViewById<Button>(R.id.one_min_button)
            val fiveMinButton = overlayView?.findViewById<Button>(R.id.five_min_button)
            val tenMinButton = overlayView?.findViewById<Button>(R.id.ten_min_button)
            val exitAppButton = overlayView?.findViewById<Button>(R.id.exit_app_button)

            val sessionMinutes = BlockedAppsHelper.getSessionMinutes(this, packageName)
            val options = buildTimeOptions(sessionMinutes)
            oneMinButton?.text = "${options[0]} min"
            fiveMinButton?.text = "${options[1]} min"
            tenMinButton?.text = "${options[2]} min"

            appNameText?.text = appName
            breathInstruction?.text = "Take a deep breath before continuing..."
            var countdown = 5
            timerText?.text = countdown.toString()

            oneMinButton?.isEnabled = false
            fiveMinButton?.isEnabled = false
            tenMinButton?.isEnabled = false
            oneMinButton?.alpha = 0.5f
            fiveMinButton?.alpha = 0.5f
            tenMinButton?.alpha = 0.5f

            timerRunnable = object : Runnable {
                override fun run() {
                    if (sessionId != overlaySessionId || !isOverlayVisible) return
                    countdown--
                    if (countdown >= 0) {
                        timerText?.text = if (countdown > 0) countdown.toString() else "✨"
                        handler.postDelayed(this, 1000)
                    } else {
                        timerText?.text = "Ready"
                        breathInstruction?.text = "How much time do you need?"
                        oneMinButton?.isEnabled = true
                        fiveMinButton?.isEnabled = true
                        tenMinButton?.isEnabled = true
                        oneMinButton?.alpha = 1.0f
                        fiveMinButton?.alpha = 1.0f
                        tenMinButton?.alpha = 1.0f
                    }
                }
            }
            handler.post(timerRunnable!!)

            val onTimeChosen: (Int) -> Unit = fun(minutes: Int) {
                completeUnlock(packageName, appName, minutes)
            }

            oneMinButton?.setOnClickListener { onTimeChosen(options[0]) }
            fiveMinButton?.setOnClickListener { onTimeChosen(options[1]) }
            tenMinButton?.setOnClickListener { onTimeChosen(options[2]) }
            exitAppButton?.setOnClickListener { declineAndExit(packageName) }

            windowManager.addView(overlayView, params)
            isOverlayVisible = true
            currentOverlayPackage = packageName
            AccessibilityService.clearInterventionInFlight()

            scheduleAutoExit(packageName, sessionId)
        } catch (e: Exception) {
            Log.e(TAG, "Error showing overlay: ${e.message}")
            AccessibilityService.clearInterventionInFlight()
            stopSelf()
        }
    }

    private fun completeUnlock(packageName: String, appName: String, minutes: Int) {
        Log.d(TAG, "Unlock $appName for $minutes min")
        cancelAutoExit()
        timerRunnable?.let { handler.removeCallbacks(it) }

        UnlockStateStore.grantUnlock(applicationContext, packageName, minutes)
        AccessibilityService.markUnlockCooldown(packageName)
        AccessibilityService.clearExitCooldown(packageName)

        isOverlayVisible = false
        currentOverlayPackage = null
        removeOverlay()

        sendBroadcast(
            Intent("APP_UNLOCKED").apply {
                putExtra("packageName", packageName)
                putExtra("appName", appName)
                putExtra("minutes", minutes)
            },
        )
    }

    private fun declineAndExit(packageName: String) {
        overlaySessionId = 0L
        cancelAutoExit()
        timerRunnable?.let { handler.removeCallbacks(it) }
        dismissOverlayOnly()
        InterventionLauncher.cancelAllPendingOverlays()
        AccessibilityService.markExitCooldown(packageName)
        AccessibilityService.resetInterventionDebounce(packageName)
        TargetAppLauncher.exitApp(applicationContext, packageName)
    }

    private fun dismissOverlayOnly() {
        overlaySessionId = 0L
        cancelAutoExit()
        timerRunnable?.let { handler.removeCallbacks(it) }
        currentOverlayPackage = null
        removeOverlay(keepServiceAlive = false)
        AccessibilityService.clearInterventionInFlight()
    }

    private fun scheduleAutoExit(packageName: String, sessionId: Long) {
        cancelAutoExit()
        autoExitRunnable = Runnable {
            if (sessionId != overlaySessionId || !isOverlayVisible) return@Runnable
            Log.d(TAG, "Auto-dismiss overlay for $packageName")
            dismissOverlayOnly()
            AccessibilityService.markExitCooldown(packageName)
        }
        handler.postDelayed(autoExitRunnable!!, AUTO_EXIT_MS)
    }

    private fun cancelAutoExit() {
        autoExitRunnable?.let { handler.removeCallbacks(it) }
        autoExitRunnable = null
    }

    private fun removeOverlay(keepServiceAlive: Boolean = false) {
        try {
            cancelAutoExit()
            timerRunnable?.let { handler.removeCallbacks(it) }
            overlayView?.let {
                windowManager.removeView(it)
                overlayView = null
            }
            isOverlayVisible = false
            currentOverlayPackage = null
        } catch (e: Exception) {
            Log.e(TAG, "Error removing overlay: ${e.message}")
            isOverlayVisible = false
            currentOverlayPackage = null
        }
        if (!keepServiceAlive) stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "IntentionalSpace",
                NotificationManager.IMPORTANCE_LOW,
            ).apply {
                description = "Shows intervention screens"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("IntentionalSpace")
            .setContentText("Monitoring app usage...")
            .setSmallIcon(android.R.drawable.ic_menu_edit)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        if (runningInstance === this) runningInstance = null
        super.onDestroy()
        removeOverlay()
        AccessibilityService.clearInterventionInFlight()
    }
}
