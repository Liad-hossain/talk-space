include .env
export $(shell sed 's/=.*//' .env)

# Backend Part of deployment

TALK_SPACE_IMG ?= ${DOCKER_HUB_USERNAME}/${DOCKER_IMAGE_NAME}:${TALK_SPACE_VERSION}
POSTGRES_IMG = "postgres:15.5-alpine"
REDIS_IMG = "bitnami/redis:6.2.5"

.PHONY: build_image
build_image:
	@ echo "Building image: ${TALK_SPACE_IMG}"
	@ docker build -t ${TALK_SPACE_IMG} -f ./DockerFile .

.PHONY: push_image
push_image:
	@ echo "Pushing image: ${TALK_SPACE_IMG}"
	@ docker push ${TALK_SPACE_IMG}


.PHONY: apply_kubernetes
apply_kubernetes:
	@echo "Applying kubernetes manifest at directory: ./deployment/$(POD_NAME) with image: $(IMAGE)"
	@sed -i.bak 's|IMAGE_PLACEHOLDER|$(IMAGE)|g' ./deployment/$(POD_NAME)/deployment.yml

	@echo "Checking for existing deployment..."
	@if kubectl get deployment $(POD_NAME) > /dev/null 2>&1; then \
		echo "Deployment exists - performing rolling update..."; \
		kubectl set image deployment/$(POD_NAME) "*=$(IMAGE)" --record; \
	else \
		echo "Creating new deployment..."; \
		kubectl apply -f ./deployment/$(POD_NAME)/deployment.yml; \
	fi

	@if [ -f ./deployment/$(POD_NAME)/service.yml ]; then \
		kubectl apply -f ./deployment/$(POD_NAME)/service.yml; \
	else \
		echo "❌ ./deployment/$(POD_NAME)/service.yml not found."; \
	fi

	@mv ./deployment/$(POD_NAME)/deployment.yml.bak ./deployment/$(POD_NAME)/deployment.yml



.PHONY: apply_kubernetes_volumes
apply_kubernetes_volumes:
	@ echo "Applying kubernetes volumes manifest at directory: ./deployment/${POD_NAME}."
	@ echo "Applying pv and pvc manifests in ./deployment/${POD_NAME}"
	@ kubectl apply -f ./deployment/${POD_NAME}/pv.yml -f ./deployment/${POD_NAME}/pvc.yml


.PHONY: wait_for_db_pod
wait_for_db_pod:
	@echo "Waiting for at least one ${POD_LABEL} pod to be running..."
	@until kubectl get pods -l app=${POD_LABEL} -o jsonpath='{.items[0].status.phase}' 2>/dev/null | grep -q Running; do \
		echo "Still waiting..."; \
		sleep 2; \
	done
	@echo "✅ At least one ${POD_LABEL} pod is now running."



.PHONY: forward_port
forward_port:
	@ echo "Waiting for pod of service: ${SERVICE_NAME} to be ready..."
	@ $(MAKE) wait_for_db_pod POD_LABEL=${POD_LABEL}
	@ echo "Pod is ready. Forwarding port for service: ${SERVICE_NAME} in container port: ${CONTAINER_PORT} to host port: ${OUTPUT_PORT}"
	@ kubectl port-forward service/${SERVICE_NAME} ${OUTPUT_PORT}:${CONTAINER_PORT} &
	@ sleep 2

.PHONY: clean
clean:
	@ echo "Cleaning up kubernetes and killing the ports that were used..."
	@ cd ./deployment/$(POD_NAME) && kubectl delete -f deployment.yml

	@if [ -f ./service.yml ]; then \
		kubectl delete -f service.yml; \
	else \
		echo "❌ ./service.yml not found."; \
	fi

	@if [ -n "$(PORT)" ]; then \
		echo "🔪 Killing process on port $(PORT)"; \
		sudo kill -9 $$(sudo lsof -t -i:$(PORT)) || echo "No process running on port $(PORT)"; \
	else \
		echo "❌ PORT is not set."; \
	fi


.PHONY: deploy_talk_space_backend_volumes
deploy_talk_space_backend_volumes:
	@ $(MAKE) apply_kubernetes_volumes POD_NAME=db
	@ $(MAKE) apply_kubernetes_volumes POD_NAME=redis



.PHONY: deploy_talk_space_backend
deploy_talk_space_backend:
	@ $(MAKE) build_image
	@ $(MAKE) push_image
	@ $(MAKE) apply_kubernetes POD_NAME=db IMAGE=${POSTGRES_IMG}
	@ $(MAKE) apply_kubernetes POD_NAME=redis IMAGE=${REDIS_IMG}
	@ $(MAKE) apply_kubernetes POD_NAME=redis_listener IMAGE=${TALK_SPACE_IMG}
	@ $(MAKE) apply_kubernetes POD_NAME=celery_default IMAGE=${TALK_SPACE_IMG}
	@ $(MAKE) apply_kubernetes POD_NAME=celery_heartbeat IMAGE=${TALK_SPACE_IMG}
	@ $(MAKE) apply_kubernetes POD_NAME=app IMAGE=${TALK_SPACE_IMG}
	@ $(MAKE) forward_port POD_LABEL=talk-space-db SERVICE_NAME=db OUTPUT_PORT=${TALK_SPACE_DB_PORT} CONTAINER_PORT=${TALK_SPACE_DB_PORT}
	@ $(MAKE) forward_port POD_LABEL=talk-space-redis SERVICE_NAME=redis OUTPUT_PORT=${GLOBAL_REDIS_PORT} CONTAINER_PORT=${GLOBAL_REDIS_PORT}
	@ $(MAKE) forward_port POD_LABEL=talk-space-app SERVICE_NAME=app OUTPUT_PORT=${TALK_SPACE_APP_PORT} CONTAINER_PORT=${TALK_SPACE_APP_PORT}

.PHONY: clean_talk_space_backend
clean_talk_space_backend:
	@ $(MAKE) clean POD_NAME=db PORT=${TALK_SPACE_DB_PORT}
	@ $(MAKE) clean POD_NAME=redis PORT=${GLOBAL_REDIS_PORT}
	@ $(MAKE) clean POD_NAME=redis-listener PORT=""
	@ $(MAKE) clean POD_NAME=celery-default PORT=""
	@ $(MAKE) clean POD_NAME=celery-heartbeat PORT=""
	@ $(MAKE) clean POD_NAME=app PORT=${TALK_SPACE_APP_PORT}

# End of backend part of deployment
