# NSIS docs: http://nsis.sourceforge.net/Docs
; # MultiUser docs: http://nsis.sourceforge.net/Docs/MultiUser/Readme.html
# MUI2 docs: http://nsis.sourceforge.net/Docs/Modern%20UI%202/Readme.html

!include "LogicLib.nsh"
!include "FileFunc.nsh"

; !define MULTIUSER_EXECUTIONLEVEL Highest
; !define MULTIUSER_MUI
; !define MULTIUSER_INSTALLMODE_COMMANDLINE
; !define MULTIUSER_INSTALLMODE_INSTDIR "Koala"
; !define MULTIUSER_INSTALLMODE_INSTDIR_REGISTRY_KEY "Software\Koala"
; !define MULTIUSER_INSTALLMODE_INSTDIR_REGISTRY_VALUENAME "InstallLocation"
; !include "MultiUser.nsh"
!include "MUI2.nsh"

# Add/Remove Programs
!define ARP "Software\Microsoft\Windows\CurrentVersion\Uninstall\Koala"

Name "Koala"
BrandingText "koala-app.com"

VIAddVersionKey /LANG=0 "ProductName" "Koala"
VIAddVersionKey /LANG=0 "Comments" "A cool tool for web developers"
VIAddVersionKey /LANG=0 "CompanyName" "koala-app.com"
VIAddVersionKey /LANG=0 "FileDescription" "Koala installer"
VIAddVersionKey /LANG=0 "FileVersion" "2017.11.22"
VIAddVersionKey /LANG=0 "ProductVersion" "2.3.0"
VIProductVersion 2.3.0.0
VIFileVersion 2017.11.22.0

SetCompressor /SOLID /FINAL lzma

# define the resulting installer's name:
OutFile "..\dist\KoalaSetup.exe"

# Default installation folder
InstallDir "$PROGRAMFILES\Koala\"

# Get installation folder from registry if available
InstallDirRegKey HKLM "${ARP}" "InstallLocation"

Var StartMenuFolder

# The icon for the installer.
!define MUI_ICON "icon.ico"

# Show a message box with a warning when the user wants to close the installer.
!define MUI_ABORTWARNING

# Pages
!insertmacro MUI_PAGE_WELCOME
; !insertmacro MULTIUSER_PAGE_INSTALLMODE

!define MUI_PAGE_CUSTOMFUNCTION_LEAVE VerifyDir
!insertmacro MUI_PAGE_DIRECTORY

!define MUI_STARTMENUPAGE_REGISTRY_ROOT "HKLM"
!define MUI_STARTMENUPAGE_REGISTRY_KEY "${ARP}"
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "Start Menu Folder"
!insertmacro MUI_PAGE_STARTMENU Application $StartMenuFolder

!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_RUN_TEXT "Start Koala"
!define MUI_FINISHPAGE_RUN "$INSTDIR\Koala.exe"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; Function .onInit
;   !insertmacro MULTIUSER_INIT
; FunctionEnd

; Function un.onInit
;   !insertmacro MULTIUSER_UNINIT
; FunctionEnd

# From http://nsis.sourceforge.net/Check_if_dir_is_empty
# And https://stackoverflow.com/a/29569614/2168921
Function VerifyDir
  Push $INSTDIR
  Call isEmptyDir
  Pop $0
  ${If} $0 == 0
  ${AndIf} ${FileExists} "$INSTDIR\*"
    MessageBox MB_ICONEXCLAMATION|MB_YESNO \
    `"$INSTDIR" already exists and is not empty.$\n\
    This installer will delete all files and folders in that directory before \
    installing Koala!$\n\
    Do you want to continue?` \
    /SD IDYES \
    IDYES yep
    Abort
  yep:
  ${EndIf}
FunctionEnd

# default section start
Section
  ReadRegStr $R0 HKLM "${ARP}" "UninstallString"
  ${If} $R0 != ""
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
    "Koala is already installed. $\n$\nClick `OK` to remove the previous version or `Cancel` to cancel this upgrade." \
    IDOK uninst
    Abort

    ;Run the uninstaller
    uninst:
    ClearErrors
    Exec $R0
  ${EndIf}

  RMDir /r "$INSTDIR"

  # define the path to which the installer should install
  SetOutPath "$INSTDIR"

  # specify the files to go in the output path
  File /r ..\build\Koala\win32\*

  # create the uninstaller
  WriteUninstaller "$INSTDIR\Uninstall Koala.exe"

  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0

  # add uninstall information to Add/Remove Programs
  WriteRegStr HKLM "${ARP}" "DisplayName" "Koala -- A cool tool for web developers"
  WriteRegStr HKLM "${ARP}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "${ARP}" "DisplayIcon" `"$INSTDIR\Koala.exe",0`
  WriteRegStr HKLM "${ARP}" "Publisher" "koala-app.com"
  WriteRegStr HKLM "${ARP}" "URLUpdateInfo" "koala-app.com"
  WriteRegStr HKLM "${ARP}" "URLInfoAbout" "koala-app.com"
  WriteRegStr HKLM "${ARP}" "DisplayVersion" "2.3.0"
  WriteRegDWORD HKLM "${ARP}" "Version" "0x02030000"
  WriteRegDWORD HKLM "${ARP}" "VersionMajor" "2"
  WriteRegDWORD HKLM "${ARP}" "VersionMinor" "3"
  WriteRegDWORD HKLM "${ARP}" "NoModify" "1"
  WriteRegDWORD HKLM "${ARP}" "NoRepair" "1"
  WriteRegDWORD HKLM "${ARP}" "EstimatedSize" "$0"
  WriteRegStr HKLM "${ARP}" "UninstallString" `$INSTDIR\Uninstall Koala.exe"`
  WriteRegStr HKLM "${ARP}" "QuietUninstallString" `"$INSTDIR\Uninstall Koala.exe" /S`

  # create shortcuts in the start menu and on the desktop
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application

    CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
    CreateShortcut "$SMPROGRAMS\$StartMenuFolder\Koala.lnk" "$INSTDIR\Koala.exe"
    CreateShortcut "$SMPROGRAMS\$StartMenuFolder\Uninstall Koala.lnk" "$INSTDIR\Uninstall Koala.exe"
    CreateShortcut "$DESKTOP\Koala.lnk" "$INSTDIR\Koala.exe"

  !insertmacro MUI_STARTMENU_WRITE_END

SectionEnd

# create a section to define what the uninstaller does
Section "Uninstall"

  # delete the installed files
  RMDir /r "$INSTDIR"

  # delete the name from Add/Remove Programs when your uninstaller completes
  DeleteRegKey HKLM "${ARP}"

  # delete the shortcuts
  !insertmacro MUI_STARTMENU_GETFOLDER Application $StartMenuFolder

  Delete "$SMPROGRAMS\$StartMenuFolder\Koala.lnk"
  Delete "$SMPROGRAMS\$StartMenuFolder\Uninstall Koala.lnk"
  RMDir "$SMPROGRAMS\$StartMenuFolder"
  Delete "$DESKTOP\Koala.lnk"

SectionEnd

# From http://nsis.sourceforge.net/Check_if_dir_is_empty
Function isEmptyDir
  # Stack ->                    # Stack: <directory>
  Exch $0                       # Stack: $0
  Push $1                       # Stack: $1, $0
  FindFirst $0 $1 "$0\*.*"
  strcmp $1 "." 0 _notempty
    FindNext $0 $1
    strcmp $1 ".." 0 _notempty
      ClearErrors
      FindNext $0 $1
      IfErrors 0 _notempty
        FindClose $0
        Pop $1                  # Stack: $0
        StrCpy $0 1
        Exch $0                 # Stack: 1 (true)
        goto _end
     _notempty:
       FindClose $0
       ClearErrors
       Pop $1                   # Stack: $0
       StrCpy $0 0
       Exch $0                  # Stack: 0 (false)
  _end:
FunctionEnd
