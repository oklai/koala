!include "MUI2.nsh"
!include "FileFunc.nsh"

Name "Koala"
BrandingText "koala-app.com"

# Add/Remove Programs
!define ARP "Software\Microsoft\Windows\CurrentVersion\Uninstall\Koala"

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

  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0

  # add uninstall information to Add/Remove Programs
  WriteRegStr HKLM "${ARP}" "DisplayName" "Koala -- A cool tool for web developers"
  WriteRegStr HKLM "${ARP}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "${ARP}" "DisplayIcon" "$\"$INSTDIR\Koala.exe$\",0"
  WriteRegStr HKLM "${ARP}" "Publisher" "koala-app.com"
  WriteRegStr HKLM "${ARP}" "URLUpdateInfo" "koala-app.com"
  WriteRegStr HKLM "${ARP}" "URLInfoAbout" "koala-app.com"
  WriteRegStr HKLM "${ARP}" "DisplayVersion" "2.1.4"
  WriteRegDWORD HKLM "${ARP}" "Version" "0x02010004"
  WriteRegDWORD HKLM "${ARP}" "VersionMajor" "2"
  WriteRegDWORD HKLM "${ARP}" "VersionMinor" "4"
  WriteRegDWORD HKLM "${ARP}" "NoModify" "1"
  WriteRegDWORD HKLM "${ARP}" "NoRepair" "1"
  WriteRegDWORD HKLM "${ARP}" "EstimatedSize" "$0"
  WriteRegStr HKLM "${ARP}" "UninstallString" "$\"$INSTDIR\Uninstall Koala.exe$\""
  WriteRegStr HKLM "${ARP}" "QuietUninstallString" "$\"$INSTDIR\Uninstall Koala.exe$\" /S"

  # create shortcuts in the start menu and on the desktop
  CreateShortCut "$SMPROGRAMS\Koala.lnk" "$INSTDIR\Koala.exe"
  CreateShortCut "$SMPROGRAMS\Uninstall Koala.lnk" "$INSTDIR\Uninstall Koala.exe"
  CreateShortCut "$DESKTOP\Koala.lnk" "$INSTDIR\Koala.exe"

SectionEnd

# create a section to define what the uninstaller does
Section "Uninstall"

  # delete the installed files
  RMDir /r $INSTDIR

  # delete the name from Add/Remove Programs when your uninstaller completes
  DeleteRegKey HKLM "${ARP}"

  # delete the shortcuts
  Delete "$SMPROGRAMS\Koala.lnk"
  Delete "$SMPROGRAMS\Uninstall Koala.lnk"
  Delete "$DESKTOP\Koala.lnk"

SectionEnd
