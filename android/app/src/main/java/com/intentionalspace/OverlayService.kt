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
    
    companion object {
        private const val TAG = "IntentionalSpace"
        private const val CHANNEL_ID = "intentional_space_overlay"
        private const val NOTIFICATION_ID = 999
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
        Log.d(TAG, "🔄 Showing intervention for: $packageName")
        showInterventionUI(packageName)
        return START_NOT_STICKY
    }
    
    private fun showInterventionUI(packageName: String) {
        try {
            // Inflate the overlay layout
            val inflater = getSystemService(LAYOUT_INFLATER_SERVICE) as LayoutInflater
            overlayView = inflater.inflate(R.layout.overlay_intervention, null)
            
            // Configure window parameters
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
            )
            
            params.gravity = Gravity.TOP or Gravity.START
            
            // Get UI elements
            val breathInstruction = overlayView?.findViewById<TextView>(R.id.breath_instruction)
            val timerText = overlayView?.findViewById<TextView>(R.id.timer_text)
            val oneMinButton = overlayView?.findViewById<Button>(R.id.one_min_button)
            val fiveMinButton = overlayView?.findViewById<Button>(R.id.five_min_button)
            val tenMinButton = overlayView?.findViewById<Button>(R.id.ten_min_button)
            
            breathInstruction?.text = "Take a deep breath before continuing..."
            
            // Breathing animation countdown
            var countdown = 5
            timerText?.text = countdown.toString()
            
            val timerRunnable = object : Runnable {
                override fun run() {
                    countdown--
                    if (countdown >= 0) {
                        timerText?.text = if (countdown > 0) countdown.toString() else "Breathe"
                        handler.postDelayed(this, 1000)
                    } else {
                        timerText?.text = "Ready"
                        breathInstruction?.text = "How much time do you need?"
                        // Enable buttons after breathing exercise
                        oneMinButton?.isEnabled = true
                        fiveMinButton?.isEnabled = true
                        tenMinButton?.isEnabled = true
                        oneMinButton?.alpha = 1.0f
                        fiveMinButton?.alpha = 1.0f
                        tenMinButton?.alpha = 1.0f
                    }
                }
            }
            handler.post(timerRunnable)
            
            // Button click handlers
            oneMinButton?.setOnClickListener {
                unlockApp(packageName, 1)
                removeOverlay()
            }
            
            fiveMinButton?.setOnClickListener {
                unlockApp(packageName, 5)
                removeOverlay()
            }
            
            tenMinButton?.setOnClickListener {
                unlockApp(packageName, 10)
                removeOverlay()
            }
            
            // Disable buttons initially
            oneMinButton?.isEnabled = false
            fiveMinButton?.isEnabled = false
            tenMinButton?.isEnabled = false
            oneMinButton?.alpha = 0.5f
            fiveMinButton?.alpha = 0.5f
            tenMinButton?.alpha = 0.5f
            
            windowManager.addView(overlayView, params)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error showing overlay: ${e.message}")
        }
    }
    
    private fun unlockApp(packageName: String, minutes: Int) {
        Log.d(TAG, "🔓 Unlocking $packageName for $minutes minutes")
        // TODO: Send event to React Native
        // TODO: Start timer for unlock period
    }
    
    private fun removeOverlay() {
        try {
            overlayView?.let {
                windowManager.removeView(it)
                overlayView = null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error removing overlay: ${e.message}")
        }
        stopSelf()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "IntentionalSpace",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows intervention screens when blocked apps are opened"
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
        Log.d(TAG, "🛑 Overlay Service Destroyed")
    }
}