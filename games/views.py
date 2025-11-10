"""This module holds the views for the the leaderboards and various games."""
# pylint: disable=no-member

import random  # Simulate random game outcomes
from rest_framework.decorators import api_view, permission_classes
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.views import UserProfile
from .models import Game, Leaderboard
from .serializers import GameSerializer, LeaderboardSerializer


# queryset defines which records the endpoint returns by default
# serializer_class tells us which view the serializer should use


class LeaderboardViewSet(viewsets.ModelViewSet):

    """
    summary: This function will hold
    the various views needed for the application's leaderboards
    """
    queryset = Leaderboard.objects.all().order_by(
        "-score")  # Sorts score highest, then descends
    serializer_class = LeaderboardSerializer


class GameViewSet(viewsets.ModelViewSet):
    """Class-based view for Game model."""
    queryset = Game.objects.all().order_by("name")
    serializer_class = GameSerializer


@api_view(['POST'])
# Only authenticated users can access this game
@permission_classes([IsAuthenticated])
def play_slots(request):
    """
    Simulates a slot machine game for the authenticated user.
    Deducts a bet amount from the user's profile and returns the result.
    """
    cost = 10
    profile = UserProfile.objects.get(username=request.user.username)
    if profile.coins < cost:  # Not enough coins to play
        return Response({'detail': 'Insufficient coins to play'}, status=400)
    profile.coins -= cost  # Deduct cost to play
    result = [random.choice(['🍒', '🔔', '7️⃣', '🍋']) for _ in range(3)]
    if len(set(result)) == 1:  # All three symbols match
        winnings = 50  # Jackpot
    elif len(set(result)) == 2:
        winnings = 20  # Two symbols match
    else:
        winnings = 0  # No match
    profile.coins += winnings  # Add winnings to profile
    profile.save()  # Save profile changes
    return Response({'result': result, 'winnings': winnings, 'coins': profile.coins})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def play_match3(request):
    """
    class for match-3 game view
    The game costs 5 coins to play.
    If the player gets a match, they win 40 coins.
    """
    cost = 5
    profile = UserProfile.objects.get(username=request.user.username)
    if profile.coins < cost:
        return Response({'detail': 'Insufficient coins'}, status=400)
    profile.coins -= cost
    tiles = ['🍎', '🍇', '🍊', '🍓']
    board = [[random.choice(tiles) for _ in range(3)] for _ in range(3)]
    win = any(len(set(row)) == 1 for row in board) or any(
        len(set(col)) == 1 for col in zip(*board))
    winnings = 40 if win else 0
    profile.coins += winnings
    profile.save()
    return Response({'board': board, 'match': win, 'winnings': winnings, 'coins': profile.coins})
