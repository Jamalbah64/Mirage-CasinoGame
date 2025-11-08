"""This module holds the views for the leaderboards"""
# pylint: disable=no-member

from rest_framework import viewsets
from .models import Game, Leaderboard
from .serializers import GameSerializer, LeaderboardSerializer


class LeaderboardViewSet(viewsets.ModelViewSet):

    """
    summary: This function will hold
    the various views needed for the application's leaderboards
    """
    queryset = Leaderboard.objects.all().order_by("-score") #Sorts score highest, then descends
    serializer_class = LeaderboardSerializer


class GameViewSet(viewsets.ModelViewSet):
    """Class-based view for Game model."""
    queryset = Game.objects.all().order_by("name")
    serializer_class = GameSerializer


#queryset defines which records the endpoint returns by default
#serializer_class tells us which view the serializer should use
