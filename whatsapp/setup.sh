#!/bin/bash

yarn
yarn upgrade ts-wapp
yarn build

while true
do
    yarn start
done