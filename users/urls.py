"""Urls file for sending API requests to the views for users"""
from rest_framework.routers import DefaultRouter
from .views import GameViewSet, LeaderboardViewSet

router = DefaultRouter()
router.register(r'games', GameViewSet, basename='games')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')

urlpatterns = router.urls
