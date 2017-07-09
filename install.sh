#!/bin/bash

cd `dirname $0`/src

# install node_modules
npm install

# install ruby gems
gem update -i rubygems
gem install -i rubygems compass -v '= 1.0.3'
gem install -i rubygems sass -v '= 3.4.25'

exit 0
