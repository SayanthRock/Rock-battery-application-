package com.sayanthrock.battery.data.preferences

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "rock_battery_preferences")

data class UserPreferences(
    val darkTheme: Boolean = true,
    val intelligentCharging80: Boolean = true,
    val hapticFeedback: Boolean = true,
    val lowPowerOptimization: Boolean = false
)

@Singleton
class UserPreferencesRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private object Keys {
        val DARK_THEME = booleanPreferencesKey("dark_theme")
        val INTELLIGENT_CHARGING = booleanPreferencesKey("intelligent_charging_80")
        val HAPTIC_FEEDBACK = booleanPreferencesKey("haptic_feedback")
        val LOW_POWER = booleanPreferencesKey("low_power_optimization")
    }

    val userPreferencesFlow: Flow<UserPreferences> = context.dataStore.data.map { prefs ->
        UserPreferences(
            darkTheme = prefs[Keys.DARK_THEME] ?: true,
            intelligentCharging80 = prefs[Keys.INTELLIGENT_CHARGING] ?: true,
            hapticFeedback = prefs[Keys.HAPTIC_FEEDBACK] ?: true,
            lowPowerOptimization = prefs[Keys.LOW_POWER] ?: false
        )
    }

    suspend fun setIntelligentCharging(enabled: Boolean) {
        context.dataStore.edit { it[Keys.INTELLIGENT_CHARGING] = enabled }
    }

    suspend fun setHapticFeedback(enabled: Boolean) {
        context.dataStore.edit { it[Keys.HAPTIC_FEEDBACK] = enabled }
    }

    suspend fun setLowPowerOptimization(enabled: Boolean) {
        context.dataStore.edit { it[Keys.LOW_POWER] = enabled }
    }
}
