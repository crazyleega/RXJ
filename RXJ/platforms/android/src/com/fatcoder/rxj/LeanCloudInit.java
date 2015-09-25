package com.fatcoder.rxj;

/**
 * Created by xiaoF on 15/9/25.
 */
import android.app.Application;
import com.avos.avoscloud.AVAnalytics;
import com.avos.avoscloud.AVOSCloud;

public class LeanCloudInit  extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // 初始化应用信息

        AVOSCloud.initialize(this, "PROuGIplobnLW5GnyR8CFXhc", "9JEyolOHOAGPJlaeh1JAmau9");
//	    // 启用崩溃错误统计
        AVAnalytics.enableCrashReport(this.getApplicationContext(), true);
//        AVOSCloud.setDebugLogEnabled(true);
    }
}