package com.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.Toast
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class ReminderWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val ACTION_SEND_REMINDER = "com.mobile.ACTION_SEND_REMINDER"
        private const val API_URL = "https://hydrationlink.onrender.com/api/widget/tap"
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_SEND_REMINDER) {
            sendReminder(context)
        }
    }

    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_reminder)

        val intent = Intent(context, ReminderWidgetProvider::class.java).apply {
            action = ACTION_SEND_REMINDER
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_button, pendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun sendReminder(context: Context) {
        val prefs = context.getSharedPreferences("HydrationLinkPrefs", Context.MODE_PRIVATE)
        val token = prefs.getString("HYDRATION_TOKEN", null)

        if (token.isNullOrEmpty()) {
            Toast.makeText(context, "Please open the app and log in first.", Toast.LENGTH_LONG).show()
            return
        }

        Toast.makeText(context, "Sending reminder... 💧", Toast.LENGTH_SHORT).show()

        thread {
            try {
                val url = URL(API_URL)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Authorization", "Bearer $token")
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true
                connection.outputStream.write("{}".toByteArray())
                connection.outputStream.flush()

                val responseCode = connection.responseCode
                connection.disconnect()

                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    if (responseCode in 200..299) {
                        Toast.makeText(context, "Reminder sent! ✅", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "Failed to send (HTTP $responseCode)", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
