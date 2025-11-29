from django.urls import path
from .views import *

urlpatterns = [
    path('bookings', get_all_bookings),
    path('bookings/<int:booking_id>/status', update_booking_status),
    path('users', get_all_users),
    path('users/<int:user_id>/delete', delete_user),
    path('service-providers', get_service_providers),
    path('service-providers/create', create_service_provider),
    path('service-providers/<str:provider_id>', update_service_provider),
    path('service-providers/<str:provider_id>/delete/', delete_service_provider),
]
