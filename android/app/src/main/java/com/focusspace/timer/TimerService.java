package com.focusspace.timer;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;

public class TimerService extends Service {
    private static final String CHANNEL_ID = "TimerServiceChannel";
    private static final int NOTIFICATION_ID = 1010;
    
    private Handler handler;
    private Runnable runnable;
    private long endTimeMillis;
    private String subjectName;
    
    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if ("START".equals(action)) {
                long durationSeconds = intent.getLongExtra("durationSeconds", 0);
                subjectName = intent.getStringExtra("subjectName");
                if (subjectName == null) subjectName = "Study";
                
                endTimeMillis = System.currentTimeMillis() + (durationSeconds * 1000);
                
                createNotificationChannel();
                startForeground(NOTIFICATION_ID, buildNotification(durationSeconds));
                
                startTimer();
            } else if ("STOP".equals(action)) {
                stopTimer();
                stopSelf();
            }
        }
        return START_NOT_STICKY;
    }

    private void startTimer() {
        stopTimer(); // Cancel any existing runnable
        runnable = new Runnable() {
            @Override
            public void run() {
                long remainingSeconds = (endTimeMillis - System.currentTimeMillis()) / 1000;
                if (remainingSeconds <= 0) {
                    updateNotification("Finished! 🎉", "Great job! Session completed.");
                    stopSelf();
                } else {
                    String timeStr = formatTime(remainingSeconds);
                    updateNotification("FocusOra Session Active", subjectName + ": " + timeStr + " remaining");
                    handler.postDelayed(this, 1000);
                }
            }
        };
        handler.post(runnable);
    }

    private void stopTimer() {
        if (handler != null && runnable != null) {
            handler.removeCallbacks(runnable);
        }
    }

    private void updateNotification(String title, String content) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotificationText(title, content));
        }
    }

    private Notification buildNotification(long durationSeconds) {
        String timeStr = formatTime(durationSeconds);
        return buildNotificationText("FocusOra Session Active", subjectName + ": " + timeStr + " remaining");
    }

    private Notification buildNotificationText(String title, String content) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            notificationIntent, 
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        int iconRes = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
        if (iconRes == 0) {
            iconRes = android.R.drawable.ic_media_play;
        }

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(content)
                .setSmallIcon(iconRes)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "FocusOra Timer Service Channel",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    private String formatTime(long totalSeconds) {
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return String.format("%02d:%02d:%02d", hours, minutes, seconds);
        } else {
            return String.format("%02d:%02d", minutes, seconds);
        }
    }

    @Override
    public void onDestroy() {
        stopTimer();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(NOTIFICATION_ID);
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
