# Generated by Django 5.2 on 2025-05-19 16:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inbox", "0004_remove_inbox_last_message_timestamp_old"),
    ]

    operations = [
        migrations.AddField(
            model_name="inbox",
            name="last_message_timestamp",
            field=models.BigIntegerField(default=0),
        ),
    ]
