from rest_framework.response import Response
from student_user.models import *
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from student_user.serializers import *
from rest_framework import status
from django.db import IntegrityError, DatabaseError
from decimal import Decimal

# Create your views here.
@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_users(request):
    users = get_user_model().objects.all()
    users = [u for u in users if u.is_serviceprovider == False and u.is_superuser == False]
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_user(request, user_id):
    """Admin can delete any regular user (not service providers or admins)"""
    try:
        User = get_user_model()
        user = User.objects.get(id=user_id)
        
        # Prevent deletion of admin users and service providers
        if user.is_superuser:
            return Response(
                {'error': 'Cannot delete admin users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if user.is_serviceprovider:
            return Response(
                {'error': 'Cannot delete service providers through this endpoint. Use service provider delete endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        username = user.username
        user.delete()
        
        return Response(
            {'message': f'User "{username}" deleted successfully'},
            status=status.HTTP_200_OK
        )
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_bookings(request):
    bookings = Booking.objects.select_related('user', 'service_provider_service').all()
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_service_providers(request):
    providers = ServiceProvider.objects.prefetch_related('services__service').all()
    serializer = ServiceProviderSerializer(providers, many=True)
    return Response(serializer.data)


def get_default_description(service_name):
    descriptions = {
        'laundry': "Professional laundry services including washing, drying, and ironing.",
        'roomcleaning': "Complete room cleaning with dusting, mopping, and sanitization.",
        'studyspaces': "Well-maintained study spaces for focused and quiet study sessions.",
        'roomrepairs': "On-demand maintenance and repair services for hostel rooms.",
        'techsupport': "Technical assistance for your devices, connectivity, and software.",
    }
    return descriptions.get(service_name, "General service provided by the hostel.")

@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_service_provider(request):
    name = request.data.get('username')
    email = request.data.get('email')
    phone = request.data.get('phone')
    service_ids = request.data.get('services', [])

    if not name or not email:
        return Response({'error': 'Name and email are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        default_password = "serviceprovider"
        user = User.objects.create_user(
            username=name,
            email=email,
            password=default_password
        )
    except (IntegrityError, DatabaseError) as e:
        return Response(
            {"error": "Username or email already exists. Please choose another."},
            status=status.HTTP_400_BAD_REQUEST
        )


    user.is_serviceprovider = True
    user.save()

    service_provider = ServiceProvider.objects.create(
        user=user,
        phone=phone,
    )

    new_services = []
    for service_name in service_ids:
        if service_name:
            desc = "".join([i for i in service_name.split()])
            service = Service.objects.create(
                name=service_name,
                description= get_default_description(desc.lower()),
                price= Decimal('100.00'),
            )
            ServiceProviderService.objects.create(
                serviceprovider=service_provider,
                service=service,
                rating=0.0
            )
            
            new_services.append(ServiceSerializer(service).data)

    return Response({
        'service_provider': {
            'id': service_provider.id,
            'user_id': user.id,
            'name': name,
            'email': email
        },
        'newly_created_services': new_services
    }, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_service_provider(request, provider_id):
    try:
        provider = ServiceProvider.objects.get(id=provider_id)
    except ServiceProvider.DoesNotExist:
        return Response({"detail": "Provider not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ServiceProviderSerializer(provider, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_service_provider(request, provider_id):
    try:
        provider = ServiceProvider.objects.get(id=provider_id)
    except ServiceProvider.DoesNotExist:
        return Response({"detail": "Provider not found."}, status=status.HTTP_404_NOT_FOUND)

    provider.delete()
    return Response({"detail": "Provider deleted."}, status=status.HTTP_204_NO_CONTENT)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminUser])
def update_booking_status(request, booking_id):
    """Admin can update any booking status"""
    try:
        booking = Booking.objects.select_related('user', 'service_provider_service__service').get(id=booking_id)
        
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
        
        # Create notification for user when admin changes status
        notification_messages = {
            'In Progress': f"Your {booking.service_provider_service.service.name} booking is now in progress.",
            'Completed': f"Your {booking.service_provider_service.service.name} booking has been marked as completed by admin. Please rate your experience!",
            'Cancelled': f"Your {booking.service_provider_service.service.name} booking has been cancelled by admin.",
            'Booked': f"Your {booking.service_provider_service.service.name} booking status has been updated to Booked."
        }
        
        if new_status in notification_messages:
            Notification.objects.create(
                user=booking.user,
                booking=booking,
                message=notification_messages[new_status]
            )
        
        serializer = BookingSerializer(booking)
        return Response({
            'message': f'Booking status updated from {old_status} to {new_status}',
            'booking': serializer.data
        })
        
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Booking not found'},
            status=status.HTTP_404_NOT_FOUND
        )
