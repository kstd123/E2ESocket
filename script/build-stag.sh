#!/bin/shAdd commentMore actions

set -x
echo "Build Bible Website..."
rm -rf .next
rm -rf bible-website.tar.gz
rm -rf node_modules


yarn install
if [ $? != "0" ]
then
  echo "Install Error"
  exit 1
fi
yarn build:prod

if [ $? != "0" ]
then
  echo "Build Error"
  exit 1
fi
rm -rf .next/cache

tar --exclude=apollo.yml  --exclude=Dockerfile --exclude="*.sh" --exclude=.git --exclude=.gitignore --exclude=.babelrc --exclude=.editorconfig -czf bible-website.tar.gz .

exit 0