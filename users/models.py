"""File for user profile model in the casino application."""
from django.db import models

# Create your models here.

class UserProfile(models.Model):
    """
    Model representing a single profile in the casino application.
    """
    username = models.CharField(max_length = 30, unique=True)
    display_name = models.CharField(max_length = 100, blank = True)
    coins = models.IntegerField(default = 0)
    avatar = models.URLField(blank = True)



    def __str__(self) -> str:
        return str(self.username or "") # Return the username as the string representation of the profile
