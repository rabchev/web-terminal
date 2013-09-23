#!/bin/bash

if [ `echo '#include <security/pam_appl.h>' | cpp -H -o /dev/null 2>&1 | head -n1 | grep 'fatal error' | wc -l` -eq "1" ]; then
  echo "WARNING: Please install the libpam-dev package and than reinstall web-terminal if you want to use the login feature. The current installation will not fail, but the feature won't be available.";
  exit 1;
fi