; uninstall-cleanup.nsh
; Remove app data on uninstall

!macro customUnInstall
  ; Ask user if they want to remove app data (AppData\Roaming)
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Deseja remover todos os dados do app (builds salvas, configurações)?$\nEsta ação é irreversível." \
    IDNO skip_appdata

  ; Remove AppData\Roaming\Tier2 Command Lab
  RMDir /r "$APPDATA\Tier2 Command Lab"

  skip_appdata:

  ; Ask user if they want to remove local app storage (cache/logs)
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Deseja remover o cache local do app em $LOCALAPPDATA\Throne & Liberty?$\nVocê pode manter para agilizar uma reinstalação futura." \
    IDNO skip_localdata

  ; Remove local app storage
  RMDir /r "$LOCALAPPDATA\Tier2 Command Lab"

  skip_localdata:
!macroend
