#!/bin/bash
echo "Deploying to stage production"
cd lambdaEdge && npx serverless deploy --stage production --verbose
cd -
cd originResponse && npx serverless deploy --stage production --verbose
