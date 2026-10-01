package com.sayanthrock.battery

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.sayanthrock.battery.ui.screens.MainBatteryScreen
import com.sayanthrock.battery.ui.theme.RockBatteryTheme
import com.sayanthrock.battery.ui.viewmodel.BatteryViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val viewModel: BatteryViewModel by viewModels {
        BatteryViewModel.provideFactory(applicationContext)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val uiState by viewModel.uiState.collectAsState()

            RockBatteryTheme(darkTheme = uiState.preferences.darkTheme) {
                MainBatteryScreen(
                    uiState = uiState,
                    onToggleIntelligentCharging = { viewModel.toggleIntelligentCharging(it) }
                )
            }
        }
    }
}
