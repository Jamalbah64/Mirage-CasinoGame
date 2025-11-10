# pylint: disable=no-member
"""Class-based view file for UserProfile model."""
from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

from .models import UserProfile
from .serializers import UserProfileSerializer

User = get_user_model()


class UserProfileViewSet(viewsets.ModelViewSet):
    """Class-based view for UserProfile model."""
    queryset = UserProfile.objects.all().order_by("id")
    serializer_class = UserProfileSerializer


class RegisterView(APIView):
    """
    POST: {"username","password","display_name"?}
    Creates Django User, optional UserProfile, returns auth token.
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """
        defining function to handle user registratio
        takes in username, password, and optional display_name
        """
        data = request.data or {}
        username = (data.get("username") or "").strip()
        password = data.get("password")
        display_name = (data.get("display_name") or "").strip()

        if not username or not password:
            return Response({"detail": "username and password are required."},
                            status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"detail": "username already taken."},
                            status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password)

        # optional profile (your model stores username, not OneToOne—fine for now)
        UserProfile.objects.get_or_create(
            username=username,
            defaults={"display_name": display_name}  # coins default in model
        )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "username": username, "display_name": display_name},
            status=status.HTTP_201_CREATED
        )
