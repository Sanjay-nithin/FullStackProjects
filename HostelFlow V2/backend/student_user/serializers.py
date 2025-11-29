from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (
    User, Service, ServiceProvider, ServiceProviderService,
    Booking, Notification
)

# ---------------- AUTH SERIALIZERS ----------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "password", "username", "room_number")

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            room_number=validated_data.get("room_number"),
            password=validated_data["password"],
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data["email"], password=data["password"])
        if user:
            return user
        raise serializers.ValidationError("Invalid credentials")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "username", "room_number", "is_superuser", "is_serviceprovider")
        read_only_fields = ("is_superuser", "is_serviceprovider")


# ---------------- SERVICE SERIALIZERS ----------------
class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "description", "price"]


class ServiceProviderServiceSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source="service",
        write_only=True
    )
    price = serializers.SerializerMethodField()
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), source="service", write_only=True
    )

    class Meta:
        model = ServiceProviderService
        fields = ["id", "service", "service_id", "price", "availability"]
  
    
    def get_price(self, obj):
        """Convert price to float for JSON serialization"""
        return float(obj.service.price)

class ServiceProviderSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    services = ServiceProviderServiceSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceProvider
        fields = ["id", "name", "email", "phone", "services"]


# ---------------- BOOKING SERIALIZERS ----------------
class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    service_provider_service = ServiceProviderServiceSerializer(read_only=True)

    # only for input
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        write_only=True
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "service_provider_service",
            "service_id",              # write-only, won’t appear in response
            "date",
            "time_slot",
            "special_instructions",
            "status",
            "comment",
        ]
        read_only_fields = ("status",)

    def create(self, validated_data):
        service = validated_data.pop("service_id")

        # Find an available service provider for this service
        sps = ServiceProviderService.objects.filter(
            service_id=service.id,
            availability=True
        ).first()

        if not sps:
            raise serializers.ValidationError(
                {"service_id": f"No available provider found for service {service.id}"}
            )

        validated_data["service_provider_service"] = sps
        return super().create(validated_data)



class BookingRescheduleSerializer(serializers.Serializer):
    date = serializers.DateField()
    time_slot = serializers.ChoiceField(choices=Booking.SERVICE_TIMES)


class BookingRateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False)


# ---------------- NOTIFICATION SERIALIZER ----------------
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "message", "created_at", "read", "booking"]
        read_only_fields = ["created_at"]
