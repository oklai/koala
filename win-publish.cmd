del nw\windows\koala.nw /q
del nw\windows\koala.exe /q
cd src
zip -r ..\nw\windows\koala.nw *
cd ..\nw\windows
copy /b nw.exe+koala.nw koala.exe
koala.exe
