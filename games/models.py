"""
    summary: Models that will be migrated into the backend
"""
from django.db import models


class Game(models.Model):
    """
    summary: This function will hold
    the various models needed for the application's games
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    max_score = models.PositiveIntegerField(default=0)
    rules = models.TextField(blank=True)

    def __str__(self):
        return str(self.name)


class Leaderboard(models.Model):
    """
    summary: This function will hold
    the various models needed for the application's leaderboards
    """
    user = models.ForeignKey("users.UserProfile", on_delete=models.CASCADE,
                            related_name="scores", null=True, blank=True)
    game = models.ForeignKey(
        Game, on_delete=models.CASCADE, related_name="scores", null=True, blank=True)
    score = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Class that defines the ordering and constraints of the model"""

        ordering = ['-score']
        verbose_name_plural = 'Leaderboards'
        constraints = [
            models.UniqueConstraint( # Ensure unique entries per user-game combination
                fields=['user', 'game', 'score', 'created_at'],
                name='uniq_entry_snapshot'
            )
        ]

    def __str__(self) -> str: # String representation of the leaderboard entry
        user_repr = getattr(self.user, "username", str(
            self.user) if self.user is not None else "")
        game_repr = getattr(self.game, "name", str(
            self.game) if self.game is not None else "")
        return f"{user_repr} · {game_repr} · {self.score}"
