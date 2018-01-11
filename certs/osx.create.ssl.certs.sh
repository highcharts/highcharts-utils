#!/bin/bash

brew install openssl

openssl req -config openssl.conf -newkey rsa:2048 -new -nodes -keyout highcharts.local.key.pem -out csr.pem
openssl x509 -req -days 365 -in csr.pem -signkey highcharts.local.key.pem -out highcharts.local.crt

