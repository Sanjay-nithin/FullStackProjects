from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from .serializers import *
from datetime import datetime, timedelta
from django.db import IntegrityError

User = get_user_model()


def get_tokens_for_user(user):
    """Generate refresh + access tokens for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    print("=== REGISTER REQUEST ===")
    print("Request data:", request.data)
    print("Request content type:", request.content_type)
    
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save(
                is_superuser=False,        
                is_serviceprovider=False,  
            )
            tokens = get_tokens_for_user(user)
            return Response(
                {
                    "user": UserSerializer(user).data,
                    "tokens": tokens,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    print("Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data
        tokens = get_tokens_for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Fetch the profile of the logged-in user"""
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics for the authenticated user"""
    user = request.user
    
    # Get bookings by status
    user_bookings = Booking.objects.filter(user=user)
    
    upcoming_bookings = user_bookings.filter(status='Booked').count()
    in_progress = user_bookings.filter(status='In Progress').count()
    completed = user_bookings.filter(status='Completed').count()
    
    # Pending review: completed bookings without comments
    pending_review = user_bookings.filter(
        status='Completed',
        comment=''
    ).count()
    
    return Response({
        'upcoming_bookings': upcoming_bookings,
        'in_progress': in_progress,
        'completed': completed,
        'pending_review': pending_review,
        'total_bookings': user_bookings.count(),
        'total_services': Service.objects.count()
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fetch_bookings(request):
    # Order by most recent first (latest bookings at top)
    bookings = Booking.objects.filter(user=request.user).order_by('-date', '-id')
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def service_list_view(request):
    try:
        services = Service.objects.all()
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(str(e))
        return Response({'error': str(e)}, status=400)
    
def parse_date_string(date_str):
    today = datetime.now().date()

    if date_str.lower() == 'today':
        return datetime.combine(today, datetime.min.time())
    elif date_str.lower() == 'tomorrow':
        return datetime.combine(today + timedelta(days=1), datetime.min.time())
    else:
        try:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
            return datetime.combine(dt.date(), datetime.min.time())
        except ValueError:
            return None

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unavailable_slots(request):
    service_id = request.GET.get('service_id')
    date_str = request.GET.get('date')
    print(date_str)

    parsed_date = parse_date_string(date_str)
    if not parsed_date:
        return Response({'error': 'Invalid date format'}, status=400)

    bookings = Booking.objects.filter(
        service_provider_service__service_id=service_id,
        date=parsed_date.date()
    )
    unavailable = set(bookings.values_list('time_slot', flat=True))
    all_time_slots = [
        '08:00-10:00',
        '10:00-12:00',
        '12:00-14:00',
        '14:00-16:00',
        '16:00-18:00',
    ]

    today_str = datetime.now().date().isoformat()
    if parsed_date.date().isoformat() == today_str:
        current_time = datetime.now().time()
        for slot in all_time_slots:
            _, end_time_str = slot.split('-')
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
            if current_time > end_time:
                unavailable.add(slot)

    return Response({'unavailable_slots': list(unavailable)})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def booking_create_view(request):
    serializer = BookingSerializer(data=request.data)
    print(request.data)
    if serializer.is_valid():
        try:
            # Save the booking
            booking = serializer.save(user=request.user)
            
            # Create notification for the service provider
            service_provider = booking.service_provider_service.serviceprovider
            service_name = booking.service_provider_service.service.name
            
            notification_message = (
                f"New booking received! {request.user.username} has booked {service_name} "
                f"for {booking.date} at {booking.time_slot}. Room: {request.user.room_number or 'N/A'}"
            )
            
            Notification.objects.create(
                user=service_provider.user,
                message=notification_message,
                booking=booking
            )
            
            return Response(serializer.data, status=201)
        except Exception as e:
            print("Error", e)
            import traceback
            traceback.print_exc()
            return Response({'error': 'An unexpected error occurred.'}, status=500)
    else:
        print(serializer.errors)
        return Response(serializer.errors, status=400)


# ---------------- SERVICE PROVIDER VIEWS ----------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def service_provider_profile(request):
    """Get service provider profile and their services"""
    user = request.user
    
    if not user.is_serviceprovider:
        return Response(
            {'error': 'User is not a service provider'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        provider = ServiceProvider.objects.get(user=user)
        serializer = ServiceProviderSerializer(provider)
        return Response(serializer.data)
    except ServiceProvider.DoesNotExist:
        return Response(
            {'error': 'Service provider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def service_provider_bookings(request):
    """Get all bookings for a service provider"""
    user = request.user
    
    if not user.is_serviceprovider:
        return Response(
            {'error': 'User is not a service provider'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        provider = ServiceProvider.objects.get(user=user)
        # Get all bookings for this provider's services, ordered by most recent first
        bookings = Booking.objects.filter(
            service_provider_service__serviceprovider=provider
        ).select_related('user', 'service_provider_service__service').order_by('-date', '-id')
        
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)
    except ServiceProvider.DoesNotExist:
        return Response(
            {'error': 'Service provider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, booking_id):
    """Update booking status by service provider"""
    user = request.user
    
    if not user.is_serviceprovider:
        return Response(
            {'error': 'User is not a service provider'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        provider = ServiceProvider.objects.get(user=user)
        
        # Get the booking and verify it belongs to this provider
        booking = Booking.objects.select_related('user', 'service_provider_service').get(
            id=booking_id,
            service_provider_service__serviceprovider=provider
        )
        
        new_status = request.data.get('status')
        
        # Validate status
        valid_statuses = ['Booked', 'In Progress', 'Completed', 'Cancelled']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update booking status
        old_status = booking.status
        booking.status = new_status
        booking.save()
        
        # Create notification for user when status changes
        if new_status == 'In Progress':
            Notification.objects.create(
                user=booking.user,
                booking=booking,
                message=f"Your {booking.service_provider_service.service.name} service has started! The service provider is now working on your request."
            )
        elif new_status == 'Completed':
            Notification.objects.create(
                user=booking.user,
                booking=booking,
                message=f"Great news! Your {booking.service_provider_service.service.name} service has been completed successfully. Please rate your experience!"
            )
        elif new_status == 'Cancelled':
            Notification.objects.create(
                user=booking.user,
                booking=booking,
                message=f"Your {booking.service_provider_service.service.name} booking has been cancelled."
            )
        
        serializer = BookingSerializer(booking)
        return Response({
            'message': f'Booking status updated from {old_status} to {new_status}',
            'booking': serializer.data
        })
        
    except ServiceProvider.DoesNotExist:
        return Response(
            {'error': 'Service provider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Booking not found or does not belong to you'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """Get all notifications for the authenticated user"""
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read for the authenticated user"""
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({'message': 'All notifications marked as read'})
