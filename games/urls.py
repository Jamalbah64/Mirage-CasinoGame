"""urls file for sending API requests to the views for games"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import GameViewSet, LeaderboardViewSet

router = DefaultRouter()
router.register(r'games', GameViewSet, basename='games')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')

# url patterns for the games
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('games.urls')),
    path('api-token-auth/', obtain_auth_token),
] + router.urls
