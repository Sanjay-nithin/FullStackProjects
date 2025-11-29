from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth import get_user_model


# ---------------- USER ----------------
class User(AbstractUser):
    email = models.EmailField(unique=True, db_index=True)
    room_number = models.CharField(max_length=10, blank=True, null=True, db_index=True)
    is_serviceprovider = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]  # keep username for AbstractUser compatibility

    def __str__(self):
        return self.email


# ---------------- SERVICE ----------------
class Service(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name


# ---------------- SERVICE PROVIDER ----------------
class ServiceProvider(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="provider_profile"
    )
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return self.user.username or self.user.email


# ---------------- SERVICE PROVIDER SERVICES ----------------
class ServiceProviderService(models.Model):
    serviceprovider = models.ForeignKey(
        ServiceProvider, on_delete=models.CASCADE, related_name="services"
    )
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="providers"
    )
    availability = models.BooleanField(default=True)
    rating = models.FloatField(default=0.0)

    class Meta:
        unique_together = ("serviceprovider", "service")

    def __str__(self):
        return f"{self.serviceprovider} - {self.service}"


# ---------------- BOOKING ----------------
class Booking(models.Model):
    SERVICE_TIMES = [
        ("08:00-10:00", "8 AM - 10 AM"),
        ("10:00-12:00", "10 AM - 12 PM"),
        ("12:00-14:00", "12 PM - 2 PM"),
        ("14:00-16:00", "2 PM - 4 PM"),
        ("16:00-18:00", "4 PM - 6 PM"),
    ]

    STATUS_CHOICES = [
        ("Booked", "Booked"),
        ("In Progress", "In Progress"),
        ("Completed", "Completed"),
        ("Cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    service_provider_service = models.ForeignKey(
        ServiceProviderService, on_delete=models.CASCADE, related_name="bookings"
    )
    date = models.DateField()
    time_slot = models.CharField(max_length=20, choices=SERVICE_TIMES)
    special_instructions = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Booked")
    comment = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.service_provider_service} - {self.date}"

    class Meta:
        unique_together = ("service_provider_service", "date", "time_slot")


# ---------------- NOTIFICATION ----------------
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user.email}: {self.message[:30]}"

    class Meta:
        ordering = ['-created_at']
