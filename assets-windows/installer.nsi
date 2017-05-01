!include "MUI2.nsh"

Name "Koala"
BrandingText "koala-app.com"

# set the icon
!define MUI_ICON "icon.ico"

# define the resulting installer's name:
OutFile "..\dist\KoalaSetup.exe"

# set the installation directory
InstallDir "$PROGRAMFILES\Koala\"

# app dialogs
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_RUN_TEXT "Start Koala"
!define MUI_FINISHPAGE_RUN "$INSTDIR\Koala.exe"

!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"

# default section start
Section

  # delete the installed files
  RMDir /r $INSTDIR

  # define the path to which the installer should install
  SetOutPath $INSTDIR

  # specify the files to go in the output path
  File /r ..\build\Koala\win32\*

  # create the uninstaller
  WriteUninstaller "$INSTDIR\Uninstall Koala.exe"

  # create shortcuts in the start menu and on the desktop
  CreateShortCut "$SMPROGRAMS\Koala.lnk" "$INSTDIR\Koala.exe"
  CreateShortCut "$SMPROGRAMS\Uninstall Koala.lnk" "$INSTDIR\Uninstall Koala.exe"
  CreateShortCut "$DESKTOP\Koala.lnk" "$INSTDIR\Koala.exe"

SectionEnd

# create a section to define what the uninstaller does
Section "Uninstall"

  # delete the installed files
  RMDir /r $INSTDIR

  # delete the shortcuts
  Delete "$SMPROGRAMS\Koala.lnk"
  Delete "$SMPROGRAMS\Uninstall Koala.lnk"
  Delete "$DESKTOP\Koala.lnk"

SectionEnd
