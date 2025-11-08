# pylint: disable=no-member
"""Class-based view file for UserProfile model."""
from rest_framework import viewsets
from .models import UserProfile
from .serializers import UserProfileSerializer

class UserProfileViewSet(viewsets.ModelViewSet):
    """Class-based view for UserProfile model."""
    queryset = UserProfile.objects.all().order_by("id")
    serializer_class = UserProfileSerializer
