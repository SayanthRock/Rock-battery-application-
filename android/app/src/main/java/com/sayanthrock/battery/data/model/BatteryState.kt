package com.sayanthrock.battery.data.model

data class BatteryState(
    val level: Int = -1,
    val isCharging: Boolean = false,
    val status: String = "Unavailable",
    val health: String = "Unavailable",
    val voltageMv: Int? = null,
    val temperatureCelsius: Float? = null,
    val technology: String? = null,
    val pluggedSource: String = "Battery",
    val currentNowMicroAmperes: Long? = null,
    val chargeCounterMicroAmpHours: Long? = null,
    val cycleCount: Int? = null,
    val timestamp: Long = System.currentTimeMillis()
) {
    val levelDisplay: String
        get() = if (level in 0..100) "$level%" else "Unavailable"

    val voltageDisplay: String
        get() = voltageMv?.let { "${"%.2f".format(it / 1000f)} V" } ?: "Unavailable"

    val temperatureDisplay: String
        get() = temperatureCelsius?.let { "${"%.1f".format(it)} °C" } ?: "Unavailable"

    val currentDisplay: String
        get() = currentNowMicroAmperes?.let {
            val mA = it / 1000
            if (mA != 0L) "$mA mA" else "Unavailable"
        } ?: "Unavailable"

    val capacityDisplay: String
        get() = chargeCounterMicroAmpHours?.let {
            val mAh = it / 1000
            if (mAh > 0) "$mAh mAh" else "Unavailable"
        } ?: "Unavailable"

    val cycleCountDisplay: String
        get() = cycleCount?.takeIf { it > 0 }?.toString() ?: "Unavailable"
}
