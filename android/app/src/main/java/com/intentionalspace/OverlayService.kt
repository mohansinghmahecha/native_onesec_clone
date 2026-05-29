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
    
    companion object {
        private const val TAG = "IntentionalSpace"
        private const val CHANNEL_ID = "intentional_space_overlay"
        private const val NOTIFICATION_ID = 999
        private const val AUTO_EXIT_MS = 10_000L

        @JvmField
        var isOverlayVisible: Boolean = false

        fun buildTimeOptions(sessionMinutes: Int): List<Int> {
            val primary = sessionMinutes.coerceIn(1, 480)
            val extras = listOf(1, 5, 10, 15, 30).filter { it != primary }
            return listOf(primary, extras[0], extras[1])
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
        Log.d(TAG, "✅ Overlay Service Created")
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val packageName = intent?.getStringExtra("package_name") ?: ""
        val appName = intent?.getStringExtra("app_name") ?: "App"

        if (
            packageName.isNotBlank() &&
            UnlockStateStore.isUnlocked(this, packageName) &&
            !BlockedAppsHelper.isDailyLimitExceeded(this, packageName)
        ) {
            AccessibilityService.clearInterventionInFlight()
            stopSelf()
            return START_NOT_STICKY
        }

        if (isOverlayVisible) {
            AccessibilityService.clearInterventionInFlight()
            return START_NOT_STICKY
        }
        
        showInterventionUI(packageName, appName)
        
        return START_NOT_STICKY
    }
    
    private fun showInterventionUI(packageName: String, appName: String) {
        if (isOverlayVisible) {
            AccessibilityService.clearInterventionInFlight()
            return
        }

        try {
            removeOverlay(keepServiceAlive = true)
            val inflater = getSystemService(LAYOUT_INFLATER_SERVICE) as LayoutInflater
            overlayView = inflater.inflate(R.layout.overlay_intervention, null)
            
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            )
            
            params.gravity = Gravity.TOP or Gravity.START
            
            // Find views by ID
            val appNameText = overlayView?.findViewById<TextView>(R.id.app_name_text)
            val breathInstruction = overlayView?.findViewById<TextView>(R.id.breath_instruction)
            val timerText = overlayView?.findViewById<TextView>(R.id.timer_text)
            val oneMinButton = overlayView?.findViewById<Button>(R.id.one_min_button)
            val fiveMinButton = overlayView?.findViewById<Button>(R.id.five_min_button)
            val tenMinButton = overlayView?.findViewById<Button>(R.id.ten_min_button)
            val exitAppButton = overlayView?.findViewById<Button>(R.id.exit_app_button)

            val sessionMinutes = BlockedAppsHelper.getSessionMinutes(this, packageName)
            val options = Companion.buildTimeOptions(sessionMinutes)
            oneMinButton?.text = "${options[0]} min"
            fiveMinButton?.text = "${options[1]} min"
            tenMinButton?.text = "${options[2]} min"
            
            // Set app name
            appNameText?.text = appName
            breathInstruction?.text = "Pause — choose how long you need on $appName"
            
            // Breathing countdown
            var countdown = 5
            timerText?.text = countdown.toString()
            breathInstruction?.text = "Take a deep breath before continuing..."
            
            timerRunnable = object : Runnable {
                override fun run() {
                    countdown--
                    if (countdown >= 0) {
                        timerText?.text = if (countdown > 0) countdown.toString() else "✨"
                        handler.postDelayed(this, 1000)
                    } else {
                        timerText?.text = "Ready"
                        breathInstruction?.text = "How much time do you need?"
                        // Enable buttons after breathing
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
            
            val onTimeChosen = { minutes: Int ->
                completeUnlock(packageName, appName, minutes)
            }

            oneMinButton?.setOnClickListener { onTimeChosen(options[0]) }
            fiveMinButton?.setOnClickListener { onTimeChosen(options[1]) }
            tenMinButton?.setOnClickListener { onTimeChosen(options[2]) }

            exitAppButton?.setOnClickListener {
                declineAndExit(packageName, appName)
            }
            
            // Initially disable time buttons (exit is always available)
            oneMinButton?.isEnabled = false
            fiveMinButton?.isEnabled = false
            tenMinButton?.isEnabled = false
            oneMinButton?.alpha = 0.5f
            fiveMinButton?.alpha = 0.5f
            tenMinButton?.alpha = 0.5f
            
            windowManager.addView(overlayView, params)
            isOverlayVisible = true
            AccessibilityService.clearInterventionInFlight()
            MainActivity.pendingShowIntervention = false
            scheduleAutoExit(packageName, appName)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error showing overlay: ${e.message}")
            AccessibilityService.clearInterventionInFlight()
            stopSelf()
        }
    }
    
    private fun completeUnlock(packageName: String, appName: String, minutes: Int) {
        Log.d(TAG, "🔓 Unlocking $appName for $minutes minutes")

        cancelAutoExit()
        UnlockStateStore.grantUnlock(applicationContext, packageName, minutes)
        AccessibilityService.markUnlockCooldown(packageName)

        isOverlayVisible = false
        removeOverlay()
        // User is already in the app — overlay was on top; no relaunch needed.

        val intent = Intent("APP_UNLOCKED")
        intent.putExtra("packageName", packageName)
        intent.putExtra("appName", appName)
        intent.putExtra("minutes", minutes)
        sendBroadcast(intent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "unlock_channel",
                "App Unlock",
                NotificationManager.IMPORTANCE_DEFAULT,
            )
            notificationManager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, "unlock_channel")
            .setContentTitle("App Unlocked")
            .setContentText("$appName is unlocked for $minutes minutes")
            .setSmallIcon(android.R.drawable.ic_menu_edit)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(packageName.hashCode(), notification)
    }

    private fun declineAndExit(packageName: String, appName: String) {
        if (!isOverlayVisible && overlayView == null) return

        cancelAutoExit()
        timerRunnable?.let { handler.removeCallbacks(it) }
        timerRunnable = null
        isOverlayVisible = false
        removeOverlay()

        AccessibilityService.markExitCooldown(packageName)
        AccessibilityService.clearInterventionInFlight()
        TargetAppLauncher.exitApp(applicationContext, packageName)
    }

    private fun scheduleAutoExit(packageName: String, appName: String) {
        cancelAutoExit()
        autoExitRunnable = Runnable {
            if (!isOverlayVisible) return@Runnable
            Log.d(TAG, "⏱️ No time selected in ${AUTO_EXIT_MS / 1000}s — auto exit $appName")
            declineAndExit(packageName, appName)
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
            timerRunnable = null
            overlayView?.let {
                windowManager.removeView(it)
                overlayView = null
            }
            isOverlayVisible = false
        } catch (e: Exception) {
            Log.e(TAG, "Error removing overlay: ${e.message}")
            isOverlayVisible = false
        }
        if (!keepServiceAlive) {
            stopSelf()
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "IntentionalSpace",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows intervention screens"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("IntentionalSpace")
            .setContentText("Monitoring app usage...")
            .setSmallIcon(android.R.drawable.ic_menu_edit)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
        AccessibilityService.clearInterventionInFlight()
    }
}