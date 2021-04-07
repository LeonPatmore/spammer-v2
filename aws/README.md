# AWS

## ECS

Pushing to ECS:

```bash
aws cloudformation create-stack --stack-name test1 --template-body file://ecs.json --parameters ParameterKey=Version,ParameterValue=53a927e40c556afb565714976bfb34fb16a49f4f ParameterKey=Subnets,ParameterValue=subnet-c8d3efe6
```

### Parameters

- Version: The docker image tag to deploy (both leader and follower).

- Subnets: A list of subnets to deploy the containers into.
