package com.sayanthrock.battery.di

import android.content.Context
import com.sayanthrock.battery.data.preferences.UserPreferencesRepository
import com.sayanthrock.battery.data.repository.BatteryRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideBatteryRepository(
        @ApplicationContext context: Context
    ): BatteryRepository = BatteryRepository(context)

    @Provides
    @Singleton
    fun provideUserPreferencesRepository(
        @ApplicationContext context: Context
    ): UserPreferencesRepository = UserPreferencesRepository(context)
}
