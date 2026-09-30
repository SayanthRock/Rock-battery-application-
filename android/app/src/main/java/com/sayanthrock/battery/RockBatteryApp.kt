package com.sayanthrock.battery

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class RockBatteryApp : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
