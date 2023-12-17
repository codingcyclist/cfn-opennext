upsert-stack: DOMAIN_NAME=cfn-next
upsert-stack: TEMPLATE_FILENAME:=$(shell mktemp)
upsert-stack:
	aws cloudformation validate-template --template-body file://template.yaml && \
	aws cloudformation package \
		--template-file template.yaml \
		--s3-bucket hochzsite-src \
		--region eu-central-1 \
		--output-template-file ${TEMPLATE_FILENAME} 2>&1 > /dev/null && \
	aws cloudformation deploy \
		--template-file ${TEMPLATE_FILENAME} \
		--parameter-overrides DomainName=${DOMAIN_NAME} \
		--stack-name ${DOMAIN_NAME} \
		--region eu-central-1 \
		--capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM && \
	aws s3 sync --delete .open-next/assets s3://${DOMAIN_NAME} --cache-control public,max-age=0,s-maxage=31536000,must-revalidate && \
	aws s3 sync --delete .open-next/assets/_next s3://${DOMAIN_NAME}/_next --cache-control public,max-age=31536000,immutable && \
	aws s3 sync --delete .open-next/cache s3://${DOMAIN_NAME}/cache
