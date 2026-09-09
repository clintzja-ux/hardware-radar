@echo off
powershell -NoProfile -Command "[Console]::Out.Write($env:RAKUTEN_SFTP_PASSWORD)"
