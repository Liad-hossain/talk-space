from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class UserInfo(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    username = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    profile_photo = models.CharField(max_length=255, null=True, default=None)
    phone_number = models.CharField(max_length=255, null=True, default=None)
    city = models.CharField(max_length=255, null=True, default=None)
    country = models.CharField(max_length=255, null=True, default=None)

    ROLE_CHOICES = [
        ("admin", "admin"),
        ("user", "user"),
        ("moderator", "moderator"),
        ("superuser", "superuser"),
        ("guest", "guest"),
        ("manager", "manager"),
    ]
    role = models.CharField(max_length=255, choices=ROLE_CHOICES, default="guest")

    STATUS_CHOICES = [
        ("active", "active"),
        ("inactive", "inactive"),
        ("suspended", "suspended"),
        ("deleted", "deleted"),
        ("deactivated", "deactivated"),
    ]
    status = models.CharField(max_length=255, choices=STATUS_CHOICES, default="inactive")
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_info"
