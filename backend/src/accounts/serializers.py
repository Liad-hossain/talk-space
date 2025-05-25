from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework import status
from accounts.models import User
from helpers.custom_exception import DRFViewException


class ValidationOnlySerializer(serializers.Serializer):
    def create(self, validated_data):
        super(ValidationOnlySerializer, self).create(validated_data)
        raise NotImplementedError("This serializer should only be used to validate data")

    def update(self, instance, validated_data):
        super(ValidationOnlySerializer, self).update(instance, validated_data)
        raise NotImplementedError("This serializer should only be used to validate data")


class RegisterSerializer(ValidationOnlySerializer):
    username = serializers.CharField(required=True, max_length=255)
    email = serializers.EmailField(required=True, max_length=255)
    password = serializers.CharField(required=True, max_length=255)
    city = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=255)
    country = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=255)


class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True, source="userinfo.username")
    email = serializers.EmailField(required=True, source="userinfo.email")
    profile_photo = serializers.CharField(required=False, source="userinfo.profile_photo")
    phone_number = serializers.CharField(required=False, source="userinfo.phone_number")
    city = serializers.CharField(required=False, source="userinfo.city")
    country = serializers.CharField(required=False, source="userinfo.country")

    class Meta:
        model = User
        fields = ["username", "email", "profile_photo", "phone_number", "city", "country"]


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        authenticate_kwargs = {
            self.username_field: attrs[self.username_field],
            "password": attrs["password"],
        }

        try:
            authenticate_kwargs["request"] = self.context["request"]
        except KeyError:
            pass

        self.user = authenticate(**authenticate_kwargs)
        if self.user is None:
            raise DRFViewException(
                detail="The password doesn't match.",
                status_code=status.HTTP_401_UNAUTHORIZED,
                error_code="invalid_password",
            )

        return super().validate(attrs)
