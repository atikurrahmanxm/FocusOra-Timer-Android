package com.focusspace.timer;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TimerPlugin")
public class TimerPlugin extends Plugin {

    @PluginMethod
    public void startNativeTimer(PluginCall call) {
        long durationSeconds = call.getInt("durationSeconds", 0);
        String subjectName = call.getString("subjectName", "Study");

        Intent serviceIntent = new Intent(getContext(), TimerService.class);
        serviceIntent.setAction("START");
        serviceIntent.putExtra("durationSeconds", durationSeconds);
        serviceIntent.putExtra("subjectName", subjectName);
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        
        JSObject ret = new JSObject();
        ret.put("status", "started");
        call.resolve(ret);
    }

    @PluginMethod
    public void stopNativeTimer(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), TimerService.class);
        serviceIntent.setAction("STOP");
        getContext().stopService(serviceIntent);
        
        JSObject ret = new JSObject();
        ret.put("status", "stopped");
        call.resolve(ret);
    }
}
