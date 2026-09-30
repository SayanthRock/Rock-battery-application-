package com.sayanthrock.battery.di

import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    // Classes with @Singleton and @Inject constructor are automatically provided by Hilt
}
