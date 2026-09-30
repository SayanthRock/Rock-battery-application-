package com.sayanthrock.battery.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sayanthrock.battery.data.model.BatteryState
import com.sayanthrock.battery.data.preferences.UserPreferences
import com.sayanthrock.battery.data.preferences.UserPreferencesRepository
import com.sayanthrock.battery.data.repository.BatteryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BatteryUiState(
    val batteryState: BatteryState = BatteryState(),
    val preferences: UserPreferences = UserPreferences(),
    val isIntelligentChargingLimitMet: Boolean = false,
    val isLoading: Boolean = false
)

@HiltViewModel
class BatteryViewModel @Inject constructor(
    private val batteryRepository: BatteryRepository,
    private val preferencesRepository: UserPreferencesRepository
) : ViewModel() {

    val uiState: StateFlow<BatteryUiState> = combine(
        batteryRepository.observeBatteryState(),
        preferencesRepository.userPreferencesFlow
    ) { battery, prefs ->
        val limitMet = battery.isCharging && prefs.intelligentCharging80 && battery.level >= 80
        BatteryUiState(
            batteryState = battery,
            preferences = prefs,
            isIntelligentChargingLimitMet = limitMet,
            isLoading = false
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = BatteryUiState(isLoading = true)
    )

    fun toggleIntelligentCharging(enabled: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setIntelligentCharging(enabled)
        }
    }

    fun toggleHapticFeedback(enabled: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setHapticFeedback(enabled)
        }
    }

    fun toggleLowPower(enabled: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setLowPowerOptimization(enabled)
        }
    }
}
