cd src
rm ../bin/koala.nw
zip -r ../bin/koala.nw *
cd ../
cat nw/linux/nw bin/koala.nw > bin/koala && chmod +x bin/koala 
cp nw/linux/nw.pak bin
bin/koala
