/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package com.fatcoder.rxj;


import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.os.StrictMode;
import android.util.Log;
import com.avos.avoscloud.*;
import org.apache.cordova.CordovaActivity;
import org.json.JSONObject;

public class MainActivity extends CordovaActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Set by <content src="index.html" /> in config.xml

//        AVInstallation.getCurrentInstallation().saveInBackground(new SaveCallback() {
//            public void done(AVException e) {
//                if (e == null) {
//
//                    // 保存成功
//                    String installationId = AVInstallation.getCurrentInstallation().getInstallationId();
//                    // 关联  installationId 到用户表等操作……
//                } else {
//                    // 保存失败，输出错误信息
//                }
//            }
//        });
//        AVInstallation.getCurrentInstallation().saveInBackground();
//        PushService.setDefaultPushCallback(this, MainActivity.class);//这里不回调的话   不能接收消息
//        PushService.subscribe(this, "news", MainActivity.class);
//        PushService.subscribe(this, "test", MainActivity.class);
//        //监控打开情况
//        AVAnalytics.trackAppOpened(getIntent());

        PushService.setDefaultPushCallback(this, MainActivity.class);//这里不回调的话   不能接收消息
        PushService.subscribe(this, "news", MainActivity.class);
        PushService.subscribe(this, "test", MainActivity.class);
        AVInstallation.getCurrentInstallation().saveInBackground(new SaveCallback() {
            public void done(AVException e) {
                if (e == null) {
                    // 保存成功
                    Log.i("out", AVInstallation.getCurrentInstallation().getInstallationId() + "");
//                    loadUrl("javascript:window.OSInfo ={os:'android',push:'"+AVInstallation.getCurrentInstallation().getInstallationId()+"'}");
                    // 关联  installationId 到用户表等操作……
                } else {
                    // 保存失败，输出错误信息
                }
            }
        });

        //监控打开情况
        AVAnalytics.trackAppOpened(getIntent());
        // Set by <content src="index.html" /> in config.xml


        if (android.os.Build.VERSION.SDK_INT > 9) {
            //SDK > 9 的时候主线程发HTTP请求
            Log.i("out", android.os.Build.VERSION.SDK_INT + "");
            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
            StrictMode.setThreadPolicy(policy);
        }

        registerMessageReceiver();
        loadUrl(launchUrl);
        try {
            Bundle bundle = getIntent().getExtras();
            if (bundle != null && bundle.containsKey("com.avos.avoscloud.Data")){
                JSONObject	json = new JSONObject(getIntent().getExtras().getString("com.avos.avoscloud.Data"));
                String message = json.getString("alert");
                String method = json.getString("method");
                String parameter = json.getString("parameter");


                System.out.println("alert===================="+message);
                //method(message);

                //loadUrl("javascript:pushMsg('"+message+"','"+msgType+"')");
            }
        } catch (Exception e) {
            // TODO Auto-generated catch block

        }
}
    @Override
    protected void onNewIntent(Intent intent) {
        // 通过intent启动应用(处于后台状况打开的信息)
        // TODO Auto-generated method stub
        super.onNewIntent(intent);

        try {
            Bundle bundle = intent.getExtras();
            if (bundle != null && bundle.containsKey("com.avos.avoscloud.Data")){
                JSONObject	json = new JSONObject(intent.getExtras().getString("com.avos.avoscloud.Data"));
                String message = json.getString("alert");
                String method = json.getString("method");
                String parameter = json.getString("parameter");
                String parameters = "";

                for (String i : parameter.split(","))
                {
                    parameters +="'"+i+"',";
                }
                parameters = parameters.substring(0, parameters.length()-1);
                parameters = method +"(" +parameters +")";

                loadUrl("javascript:"+parameters+" ");


            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onResume() {
        // TODO Auto-generated method stub
        //每次APP唤醒
        super.onResume();
        loadUrl("javascript:getLocation()");
    }

    @Override
    public void onDestroy() {
        // TODO Auto-generated method stub
        unregisterReceiver(mMessageReceiver);
        super.onDestroy();
    }

    public MessageReceiver mMessageReceiver;
    public static String ACTION_INTENT_RECEIVER = "com.fatcoder.rxj.inside.push";
    public static String ONRESUME_RECEIVER = "com.fatcoder.rxj.onresume.push";

    /**
     * 动态注册广播
     */
    public void registerMessageReceiver() {
        mMessageReceiver = new MessageReceiver();
        IntentFilter filter = new IntentFilter();

        filter.addAction(ACTION_INTENT_RECEIVER);
        registerReceiver(mMessageReceiver, filter);
    }

    public class MessageReceiver extends BroadcastReceiver {

        @Override
        public void onReceive(Context context, Intent intent) {
            // TODO Auto-generated method stub
            if (intent.getAction().equals(ACTION_INTENT_RECEIVER)) {
                try {
                    Bundle bundle = intent.getExtras();
                    if (bundle != null && bundle.containsKey("com.avos.avoscloud.Data")){
                        JSONObject	json = new JSONObject(intent.getExtras().getString("com.avos.avoscloud.Data"));
                        String message = json.getString("alert");
                        String method = json.getString("method");
                        String parameter = json.getString("parameter");
                        String parameters = "";

                        for (String i : parameter.split(","))
                        {
                            parameters +="\""+ i +"\""+",";//添加JS引号转义
                        }
                        parameters= parameters.substring(0, parameters.length()-1);
                        parameters = "'"+method +"(" +parameters +")" +"'";
                        loadUrl("javascript:pushMsg('"+message+"',"+parameters+" )");
                    }
                } catch (Exception e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }

            }
        }

    }
}
