"""Admin configuration for game models in the casino application."""
from django.contrib import admin
from .models import Game, Leaderboard
admin.site.register(Game)
admin.site.register(Leaderboard)
# Register the Game and Leaderboard models with the admin site
