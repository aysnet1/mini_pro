@REM run sql migrations
@ECHO OFF

SETLOCAL EnableDelayedExpansion

ECHO ========================================
ECHO  Database Initialization Script
ECHO ========================================
ECHO.

SET "DB_USER=root"
SET "DB_NAME=logement_etudiant14"
SET "BASE_DIR=src-ssr\database"

ECHO [1/3] Running base database schema...
mysql -u %DB_USER%  < %BASE_DIR%\BaseDeDonnees.sql
IF !ERRORLEVEL! NEQ 0 (
    ECHO [ERROR] Failed to run BaseDeDonnees.sql
    EXIT /B !ERRORLEVEL!
)
ECHO [SUCCESS] Base database schema applied.
ECHO.

ECHO [2/3] Running create_etablissement_table migration...
mysql -u %DB_USER%  < %BASE_DIR%\migrations\create_etablissement_table.sql
IF !ERRORLEVEL! NEQ 0 (
    ECHO [ERROR] Failed to run create_etablissement_table.sql
    EXIT /B !ERRORLEVEL!
)
ECHO [SUCCESS] Etablissement table created.
ECHO.

ECHO [3/3] Running add_is_disabled_to_user migration...
mysql -u %DB_USER%  < %BASE_DIR%\migrations\add_is_disabled_to_user.sql
IF !ERRORLEVEL! NEQ 0 (
    ECHO [ERROR] Failed to run add_is_disabled_to_user.sql
    EXIT /B !ERRORLEVEL!
)
ECHO [SUCCESS] User table updated.
ECHO.

ECHO ========================================
ECHO  Database initialization completed!
ECHO ========================================

ENDLOCAL