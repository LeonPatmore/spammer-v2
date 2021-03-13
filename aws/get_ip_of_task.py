import subprocess
import json

CLUSTER_NAME = "SpammerV2Cluster"

tasks = subprocess.run(["aws", "ecs", "list-tasks", "--cluster", CLUSTER_NAME], stdout=subprocess.PIPE)

tasks_json = json.loads(tasks.stdout)

task_arn = tasks_json["taskArns"][0]

described_task = subprocess.run(["aws", "ecs", "describe-tasks", "--cluster", CLUSTER_NAME, "--tasks", task_arn], stdout=subprocess.PIPE)

described_task_json = json.loads(described_task.stdout)

task_details = described_task_json["tasks"][0]["attachments"][0]["details"]

eni_id = None

for task_detail in task_details:
    if task_detail["name"] == "networkInterfaceId":
        eni_id = task_detail["value"]

described_eni = subprocess.run(["aws", "ec2", "describe-network-interfaces", "--network-interface-ids", eni_id], stdout=subprocess.PIPE)

described_eni_json = json.loads(described_eni.stdout)

public_ip = described_eni_json["NetworkInterfaces"][0]["Association"]["PublicIp"]

print(public_ip)
