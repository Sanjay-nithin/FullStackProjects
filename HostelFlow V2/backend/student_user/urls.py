from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Auth endpoints
    path("auth/register", register_view, name="register"),
    path("auth/login", login_view, name="login"),
    path("auth/profile", profile_view, name="profile"),
    path("auth/token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    
    # Stats endpoints
    path("stats/dashboard", dashboard_stats, name="Dashboard"),
    
    # Booking endpoints
    path('bookings/my', fetch_bookings),
    path('bookings/availability', get_unavailable_slots),
    path('bookings', booking_create_view),
    
    # Service endpoints
    path('services', service_list_view),
    
    # Service Provider endpoints
    path('service-provider/profile', service_provider_profile, name='service_provider_profile'),
    path('service-provider/bookings', service_provider_bookings, name='service_provider_bookings'),
    path('service-provider/bookings/<int:booking_id>/status', update_booking_status, name='update_booking_status'),
    
    # Notification endpoints
    path('notifications', get_user_notifications, name='get_user_notifications'),
    path('notifications/<int:notification_id>/read', mark_notification_read, name='mark_notification_read'),
    path('notifications/mark-all-read', mark_all_notifications_read, name='mark_all_notifications_read'),
]
