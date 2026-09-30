package com.sayanthrock.battery.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Rock Flow Motion Durations (ms)
object RockMotion {
    const val MICRO = 100
    const val QUICK = 140
    const val STANDARD = 180
    const val SMOOTH = 240
    const val TRANSITION = 280
}

private val DarkColorScheme = darkColorScheme(
    primary = EmeraldPrimary,
    onPrimary = CharcoalDark,
    primaryContainer = CharcoalSurfaceHigh,
    onPrimaryContainer = EmeraldLight,
    secondary = SkyAccent,
    background = CharcoalDark,
    onBackground = TextPrimaryDark,
    surface = CharcoalSurface,
    onSurface = TextPrimaryDark,
    surfaceVariant = CharcoalSurfaceHigh,
    onSurfaceVariant = TextSecondaryDark,
    outline = CharcoalBorder,
    error = RoseCritical
)

private val LightColorScheme = lightColorScheme(
    primary = EmeraldDark,
    onPrimary = LightSurface,
    primaryContainer = LightSurface,
    onPrimaryContainer = EmeraldDark,
    secondary = SkyAccent,
    background = LightBackground,
    onBackground = TextPrimaryLight,
    surface = LightSurface,
    onSurface = TextPrimaryLight,
    surfaceVariant = LightBackground,
    onSurfaceVariant = TextSecondaryLight,
    outline = LightBorder,
    error = RoseCritical
)

@Composable
fun RockBatteryTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            window.navigationBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
